import {Composition} from 'remotion';
import {TemplateVideo} from './TemplateVideo';
import {FPS, HEIGHT, WIDTH, getDurationInFrames, leads} from './videoData';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="main"
        component={TemplateVideo}
        durationInFrames={getDurationInFrames(leads[0].id)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{leadId: leads[0].id}}
      />
      {leads.map((lead) => (
        <Composition
          key={lead.id}
          id={String(lead.id).replace(/_/g, '-')}
          component={TemplateVideo}
          durationInFrames={getDurationInFrames(lead.id)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{leadId: lead.id}}
        />
      ))}
    </>
  );
};
