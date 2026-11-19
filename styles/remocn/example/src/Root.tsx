import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './Composition';
import script from '../script.json';

export const RemotionRoot: React.FC = () => {
  const fps = 30;
  const durationInFrames = Math.round(55 * fps);

  return (
    <>
      <Composition
        id="Main"
        component={MainComposition}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{ script }}
      />
    </>
  );
};
