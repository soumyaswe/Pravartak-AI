import {
  AnimationClip,
  NumberKeyframeTrack
} from 'three';

const fps = 60;

function modifiedKey(key) {
  if (["eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight", 
       "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight"].includes(key)) {
    return key;
  }

  if (key.endsWith("Right")) {
    return key.replace("Right", "_R");
  }
  if (key.endsWith("Left")) {
    return key.replace("Left", "_L");
  }
  return key;
}

function createAnimation(recordedData, morphTargetDictionary, bodyPart) {
  if (recordedData.length != 0) {
    let animation = [];
    for (let i = 0; i < Object.keys(morphTargetDictionary).length; i++) {
      animation.push([]);
    }
    let time = [];
    let finishedFrames = 0;
    
    recordedData.forEach((d, i) => {
      Object.entries(d.blendshapes).forEach(([key, value]) => {
        if (!(modifiedKey(key) in morphTargetDictionary)) {
          return;
        }
        
        // Heavy smoothing for natural, slow movements
        let smoothedValue = value;
        
        // Apply 5-frame smoothing for very smooth transitions
        if (i >= 2 && i < recordedData.length - 2) {
          const prev2 = recordedData[i - 2].blendshapes[key] || 0;
          const prev1 = recordedData[i - 1].blendshapes[key] || 0;
          const next1 = recordedData[i + 1].blendshapes[key] || 0;
          const next2 = recordedData[i + 2].blendshapes[key] || 0;
          
          // Gaussian-like weighted average for ultra-smooth motion
          smoothedValue = (prev2 * 0.05 + prev1 * 0.25 + value * 0.4 + next1 * 0.25 + next2 * 0.05);
        } else if (i > 0 && i < recordedData.length - 1) {
          // 3-frame smoothing for edges
          const prevValue = recordedData[i - 1].blendshapes[key] || 0;
          const nextValue = recordedData[i + 1].blendshapes[key] || 0;
          smoothedValue = (prevValue * 0.25 + value * 0.5 + nextValue * 0.25);
        }
        
        // Special handling for mouthShrugUpper to improve lip appearance
        if (key == 'mouthShrugUpper') {
          smoothedValue += 0.3;
        }
        
        // Reduce overall intensity for more subtle movement
        smoothedValue *= 0.8;
        
        // Clamp values between 0 and 1
        smoothedValue = Math.max(0, Math.min(1, smoothedValue));
        
        animation[morphTargetDictionary[modifiedKey(key)]].push(smoothedValue);
      });
      time.push(finishedFrames / fps);
      finishedFrames++;
    });

    let tracks = [];

    //create morph animation
    Object.entries(recordedData[0].blendshapes).forEach(([key, value]) => {
      if (!(modifiedKey(key) in morphTargetDictionary)) {
        return;
      }
      let i = morphTargetDictionary[modifiedKey(key)];
      let track = new NumberKeyframeTrack(
        `${bodyPart}.morphTargetInfluences[${i}]`,
        time,
        animation[i]
      );
      tracks.push(track);
    });

    const clip = new AnimationClip('animation', -1, tracks);
    return clip;
  }
  return null;
}

export default createAnimation;
