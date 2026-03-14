from __future__ import annotations

import asyncio
import json
import re
import subprocess
import time
from pathlib import Path
from typing import Any

from jinja2 import Template
from mutagen.mp3 import MP3

from app.config import settings
from app.models import DirectVideoRequest

VOICE_MAP = {
    'English': 'en-US-EmmaMultilingualNeural',
    'Hindi': 'hi-IN-SwaraNeural',
    'Marathi': 'mr-IN-AarohiNeural',
    'Tamil': 'ta-IN-PallaviNeural',
    'Telugu': 'te-IN-MohanNeural',
    'Kannada': 'kn-IN-SapnaNeural',
    'Bengali': 'bn-IN-TanishaNeural',
    'Gujarati': 'gu-IN-DhwaniNeural',
    'Malayalam': 'ml-IN-SobhanaNeural',
    'Punjabi': 'pa-IN-KritikaNeural',
}

DEFAULT_SCRIPT = """नमस्ते {{ customer_name }}।
मैं {{ client_name }} की ओर से आपके {{ product_type }} खाते के संबंध में एक महत्वपूर्ण औपचारिक सूचना साझा कर रही हूँ।
हमारी जानकारी के अनुसार इस खाते की मूल राशि {{ loan_amount }} थी और वर्तमान कुल बकाया राशि {{ tos }} है।
खाता संख्या {{ lan }} पर लंबित भुगतान के बारे में पहले भी सूचित किया गया था, लेकिन स्थिति अभी तक सामान्य नहीं हुई है।
कृपया इस सूचना को गंभीरता से लें और भुगतान अथवा पुनर्भुगतान विकल्प पर चर्चा के लिए तुरंत {{ contact_details }} पर संपर्क करें।
समय पर प्रतिक्रिया देने से आगे की एस्केलेशन से बचने में मदद मिल सकती है।
धन्यवाद।"""


class RemotionService:
    _single_brace_pattern = re.compile(r'(?<!{){([^{}\s]+)}(?!})')
    _vtt_pattern = re.compile(
        r'(\d{2}:\d{2}:\d{2}[.,]\d{3}) --> (\d{2}:\d{2}:\d{2}[.,]\d{3})\n(.+?)(?=\n\n|\Z)',
        re.DOTALL,
    )

    def __init__(self, remotion_path: Path | None = None) -> None:
        self.remotion_path = remotion_path or settings.remotion_path
        self.output_dir = settings.output_dir / 'remotion'

    def ensure_project_available(self) -> None:
        required_paths = [
            self.remotion_path,
            self.remotion_path / 'package.json',
            self.remotion_path / 'src' / 'index.jsx',
            self.remotion_path / 'public',
        ]
        missing = [path for path in required_paths if not path.exists()]
        if missing:
            missing_display = ', '.join(str(path) for path in missing)
            raise RuntimeError(
                f"Remotion project is incomplete at '{self.remotion_path}'. Missing: {missing_display}."
            )

    @classmethod
    def normalize_placeholder_syntax(cls, text: str) -> str:
        return cls._single_brace_pattern.sub(r'{{\1}}', text)

    @staticmethod
    def build_render_context(request: DirectVideoRequest) -> dict[str, Any]:
        customer_name = request.customer_name or 'Customer'
        client_name = request.client_name or 'Bank'
        loan_amount = request.loan_amount or 'amount'
        tos = request.tos or 'outstanding'
        lan = request.lan or 'N/A'
        contact_details = request.contact_details or '1800-XXX-XXXX'
        product_type = request.product_type or 'loan'
        return {
            'customer_name': customer_name,
            'customer': customer_name,
            'client_name': client_name,
            'client': client_name,
            'loan_amount': loan_amount,
            'loan_amt': loan_amount,
            'amt': loan_amount,
            'tos': tos,
            'balance': tos,
            'outstanding': tos,
            'lan': lan,
            'account_number': lan,
            'contact_details': contact_details,
            'helpline': contact_details,
            'contact': contact_details,
            'product_type': product_type,
            'product': product_type,
        }

    def render_script(self, request: DirectVideoRequest) -> str:
        template_text = request.script_text or DEFAULT_SCRIPT
        processed_template = self.normalize_placeholder_syntax(template_text)
        template = Template(processed_template)
        rendered = template.render(**self.build_render_context(request))
        return ' '.join(rendered.split())

    @staticmethod
    def _normalize_text(value: Any, fallback: str) -> str:
        if value is None:
            return fallback

        if isinstance(value, (int, float)):
            return str(value)

        cleaned = str(value).strip()
        return cleaned or fallback

    @staticmethod
    def _extract_numeric_amount(value: Any) -> int | None:
        if value is None:
            return None

        if isinstance(value, bool):
            return None

        if isinstance(value, (int, float)):
            return int(round(value))

        cleaned = re.sub(r'[^\d.]', '', str(value))
        if not cleaned:
            return None

        try:
            return int(round(float(cleaned)))
        except ValueError:
            return None

    @staticmethod
    def _format_indian_number(value: int) -> str:
        digits = str(abs(value))
        if len(digits) <= 3:
            grouped = digits
        else:
            grouped = digits[-3:]
            digits = digits[:-3]
            while digits:
                grouped = f'{digits[-2:]},{grouped}'
                digits = digits[:-2]
        return f"-{grouped}" if value < 0 else grouped

    @classmethod
    def format_amount_display(cls, value: Any, fallback: str = 'राशि उपलब्ध नहीं') -> str:
        numeric_value = cls._extract_numeric_amount(value)
        if numeric_value is None:
            cleaned = str(value).strip() if value is not None else ''
            return cleaned or fallback
        return f'₹{cls._format_indian_number(numeric_value)}'

    @classmethod
    def determine_urgency_level(cls, tos: Any) -> str:
        numeric_tos = cls._extract_numeric_amount(tos)
        if numeric_tos is None:
            return 'elevated'
        if numeric_tos >= 100000:
            return 'critical'
        if numeric_tos >= 50000:
            return 'high'
        return 'elevated'

    @staticmethod
    def _product_content(product_type: str) -> dict[str, str]:
        normalized = product_type.strip().lower().replace('_', ' ') if product_type else 'loan'
        mapping = {
            'loan': {
                'label': 'लोन खाता',
                'formal': 'ऋण खाते',
                'summary': 'लोन भुगतान स्थिति',
            },
            'insurance': {
                'label': 'बीमा खाता',
                'formal': 'बीमा खाते',
                'summary': 'बीमा भुगतान स्थिति',
            },
            'credit card': {
                'label': 'क्रेडिट कार्ड खाता',
                'formal': 'क्रेडिट कार्ड खाते',
                'summary': 'क्रेडिट कार्ड स्थिति',
            },
        }
        return mapping.get(
            normalized,
            {
                'label': f'{normalized.title()} खाता' if normalized else 'खाता',
                'formal': f'{normalized.title()} खाते' if normalized else 'खाते',
                'summary': 'भुगतान स्थिति',
            },
        )

    def build_scene_payload(
        self,
        request: DirectVideoRequest,
        display_amounts: dict[str, Any],
        urgency_level: str,
    ) -> dict[str, Any]:
        customer_name = self._normalize_text(request.customer_name, 'Customer')
        client_name = self._normalize_text(request.client_name, 'Bank')
        lan = self._normalize_text(request.lan, 'N/A')
        contact_details = self._normalize_text(request.contact_details, '1800-XXX-XXXX')
        product_content = self._product_content(self._normalize_text(request.product_type, 'loan'))
        outstanding_value = display_amounts['primary']['value']
        loan_value = display_amounts['secondary']['value']
        urgency_copy = {
            'critical': 'तत्काल हस्तक्षेप आवश्यक',
            'high': 'शीघ्र समाधान आवश्यक',
            'elevated': 'समय-संवेदी औपचारिक सूचना',
        }[urgency_level]
        secondary_note = (
            f"मूल राशि {loan_value}"
            if display_amounts['secondary']['available']
            else 'उपलब्ध अभिलेखों के अनुसार भुगतान विलंब जारी है'
        )
        headline_text = f'{customer_name} जी, आपके {product_content["formal"]} पर तत्काल ध्यान आवश्यक है'
        cta_text = (
            f'{customer_name}, समाधान और पुनर्भुगतान विकल्पों पर बात करने के लिए अभी {contact_details} पर संपर्क करें।'
        )

        return {
            'opening': {
                'eyebrow': 'औपचारिक सूचना',
                'headline': headline_text,
                'subheadline': f'{client_name} | खाता {lan}',
            },
            'account': {
                'eyebrow': product_content['summary'],
                'headline': f'खाता {lan}',
                'supporting': f'वर्तमान कुल बकाया {outstanding_value}',
                'badge': urgency_copy,
            },
            'context': {
                'eyebrow': 'स्थिति सारांश',
                'headline': f'{product_content["label"]} में निरंतर विलंब दर्ज है',
                'body': (
                    f'{client_name} के रिकॉर्ड के अनुसार भुगतान समय पर नहीं हुआ है। '
                    f'कुल बकाया राशि {outstanding_value} तक पहुंच चुकी है और स्थिति पर अब औपचारिक ध्यान अपेक्षित है।'
                ),
            },
            'amounts': {
                'eyebrow': 'वित्तीय मुख्य बिंदु',
                'headline': 'राशि सारांश',
                'body': secondary_note,
                'note': 'कृपया भुगतान या पुनर्भुगतान विकल्प पर तुरंत चर्चा करें।',
            },
            'action': {
                'eyebrow': 'तत्काल अगला कदम',
                'headline': 'आज ही संपर्क करें',
                'body': cta_text,
                'cta_label': 'संपर्क नंबर',
                'cta_value': contact_details,
            },
            'closing': {
                'eyebrow': 'समाधान अभी भी संभव है',
                'headline': 'समय पर प्रतिक्रिया से आगे की एस्केलेशन टल सकती है',
                'body': f'{client_name} आपकी त्वरित प्रतिक्रिया की प्रतीक्षा कर रहा है।',
            },
            'headline_text': headline_text,
            'cta_text': cta_text,
        }

    def build_render_payload(
        self,
        request: DirectVideoRequest,
        job_id: str,
        script_text: str,
    ) -> dict[str, Any]:
        customer_name = self._normalize_text(request.customer_name, 'Customer')
        lan = self._normalize_text(request.lan, 'N/A')
        client_name = self._normalize_text(request.client_name, 'Bank')
        language = self._normalize_text(request.language, 'Hindi')
        contact_details = self._normalize_text(request.contact_details, '1800-XXX-XXXX')
        product_type = self._normalize_text(request.product_type, 'loan')
        urgency_level = self.determine_urgency_level(request.tos)
        display_amounts = {
            'primary': {
                'label': 'कुल बकाया राशि',
                'value': self.format_amount_display(request.tos),
                'raw': self._normalize_text(request.tos, '0'),
                'available': True,
            },
            'secondary': {
                'label': 'मूल ऋण राशि',
                'value': self.format_amount_display(request.loan_amount),
                'raw': self._normalize_text(request.loan_amount, ''),
                'available': request.loan_amount is not None and str(request.loan_amount).strip() != '',
            },
        }
        scene_payload = self.build_scene_payload(request, display_amounts, urgency_level)

        return {
            'id': job_id,
            'customer_name': customer_name,
            'lan': lan,
            'client_name': client_name,
            'language': language,
            'loan_amount': self._normalize_text(request.loan_amount, ''),
            'tos': self._normalize_text(request.tos, '0'),
            'contact_details': contact_details,
            'product_type': product_type,
            'script_text': script_text,
            'title_prefix': self._normalize_text(request.title_prefix, 'Loan Recall'),
            'display_amounts': display_amounts,
            'scene_payload': scene_payload,
            'headline_text': scene_payload['headline_text'],
            'cta_text': scene_payload['cta_text'],
            'urgency_level': urgency_level,
        }

    @staticmethod
    def _time_to_seconds(value: str) -> float:
        normalized = value.replace(',', '.')
        hours, minutes, seconds = normalized.split(':')
        return int(hours) * 3600 + int(minutes) * 60 + float(seconds)

    def parse_vtt(self, vtt_path: Path) -> list[dict[str, Any]]:
        if not vtt_path.exists():
            return []

        content = vtt_path.read_text(encoding='utf-8')
        subtitles: list[dict[str, Any]] = []
        for start, end, text in self._vtt_pattern.findall(content):
            subtitles.append(
                {
                    'text': ' '.join(text.split()),
                    'start': self._time_to_seconds(start),
                    'end': self._time_to_seconds(end),
                }
            )
        return subtitles

    def _audio_dir(self) -> Path:
        return self.remotion_path / 'public' / 'audio'

    def _metadata_path(self) -> Path:
        return self.remotion_path / 'public' / 'metadata.json'

    async def generate_tts(self, request: DirectVideoRequest) -> dict[str, Any]:
        self.ensure_project_available()

        audio_dir = self._audio_dir()
        audio_dir.mkdir(parents=True, exist_ok=True)
        metadata_path = self._metadata_path()
        self.output_dir.mkdir(parents=True, exist_ok=True)

        language = request.language or 'Hindi'
        voice = VOICE_MAP.get(language, VOICE_MAP['Hindi'])
        text_content = self.render_script(request)
        job_id = f'{request.lan}_{int(time.time())}'
        audio_file = audio_dir / f'{job_id}.mp3'
        vtt_file = audio_dir / f'{job_id}.vtt'
        temp_text_file = self.remotion_path / 'public' / f'temp_{job_id}.txt'
        temp_text_file.write_text(text_content, encoding='utf-8')

        command = [
            settings.edge_tts_binary,
            '--file',
            str(temp_text_file),
            '--voice',
            voice,
            '--write-media',
            str(audio_file),
            '--write-subtitles',
            str(vtt_file),
        ]

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            _stdout, stderr = await process.communicate()
            if process.returncode != 0:
                raise RuntimeError(f'Edge TTS failed: {stderr.decode().strip()}')

            duration = MP3(str(audio_file)).info.length
            subtitles = self.parse_vtt(vtt_file)
            metadata: dict[str, Any] = {}
            if metadata_path.exists():
                try:
                    metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
                except json.JSONDecodeError:
                    metadata = {}

            metadata[job_id] = {
                'duration': duration,
                'subtitles': subtitles,
                'tts_provider': 'edge-tts',
            }
            metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding='utf-8')
            return {
                'job_id': job_id,
                'audio_path': audio_file,
                'subtitle_path': vtt_file,
                'text': text_content,
            }
        finally:
            if temp_text_file.exists():
                temp_text_file.unlink()

    async def render_video(self, request: DirectVideoRequest, job_id: str, script_text: str) -> Path:
        self.ensure_project_available()
        self.output_dir.mkdir(parents=True, exist_ok=True)
        leads_path = self.remotion_path / 'leads.json'
        leads: list[dict[str, Any]] = []
        if leads_path.exists():
            try:
                loaded = json.loads(leads_path.read_text(encoding='utf-8'))
                if isinstance(loaded, list):
                    leads = [item for item in loaded if isinstance(item, dict)]
            except json.JSONDecodeError:
                leads = []

        leads = [lead for lead in leads if lead.get('id') != job_id]
        leads.append(self.build_render_payload(request, job_id, script_text))
        leads_path.write_text(
            json.dumps(leads, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )

        output_path = self.output_dir / f'{job_id}.mp4'
        primary_command = [
            settings.remotion_npx_binary,
            'remotion',
            'render',
            'src/index.jsx',
            job_id.replace('_', '-'),
            str(output_path),
            '--overwrite',
        ]
        fallback_command = [
            settings.remotion_npx_binary,
            'remotion',
            'render',
            'src/index.jsx',
            'main',
            str(output_path),
            '--props',
            json.dumps({'leadId': job_id}),
            '--overwrite',
        ]

        for command in (primary_command, fallback_command):
            process = await asyncio.create_subprocess_exec(
                *command,
                cwd=str(self.remotion_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            _stdout, stderr = await process.communicate()
            if process.returncode == 0:
                return output_path
            last_error = stderr.decode().strip()

        raise RuntimeError(f'Remotion render failed: {last_error}')

    async def generate_video(self, request: DirectVideoRequest) -> dict[str, Any]:
        tts_result = await self.generate_tts(request)
        video_path = await self.render_video(request, tts_result['job_id'], tts_result['text'])
        return {
            'job_id': tts_result['job_id'],
            'video_path': video_path,
            'audio_path': tts_result['audio_path'],
            'text': tts_result['text'],
        }
