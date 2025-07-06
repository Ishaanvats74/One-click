export const filterAnchors = {
  eyes: (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const centerX = (leftEye[0].x + rightEye[3].x) / 2;
    const centerY = (leftEye[0].y + rightEye[3].y) / 2;
    const width = Math.abs(rightEye[3].x - leftEye[0].x);
    return { x: centerX, y: centerY, width };
  },
  nose: (landmarks) => {
    const nose = landmarks.getNose();
    const center = nose[Math.floor(nose.length / 2)];
    return { x: center.x, y: center.y, width: 60 };
  },
  forehead: (landmarks) => {
    const jaw = landmarks.getJawOutline();
    const center = jaw[16];
    return { x: center.x, y: center.y - 150, width: 100 };
  },
};

export const overlayFilters = {
    none :{src:'',anchor:'',scale:''},
  glasses: { src: '/filters/glasses.png', anchor: 'eyes', scale: 2.0 },
  mustache: { src: '/filters/mustache.png', anchor: 'nose', scale: 1.5 },
  hat: { src: '/filters/hat.png', anchor: 'forehead', scale: 2.5 },
  crown: {
    src: '/filters/crown.png',
    anchorFunc: (landmarks) => {
      const jaw = landmarks.getJawOutline();
      const pt = jaw[16];
      return { x: pt.x, y: pt.y - 120, width: 80 };
    },
    scale: 1.8,
  },
};
