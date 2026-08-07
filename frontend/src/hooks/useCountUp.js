import { useState, useEffect } from 'react';

export function useCountUp(endValue, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrameId;

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      // Ease out quartic for a premium deceleration effect
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

      const percentage = Math.min(progress / duration, 1);
      const easedProgress = easeOutQuart(percentage);

      const currentCount = Math.floor(easedProgress * endValue);
      setCount(currentCount);

      if (percentage < 1) {
        animationFrameId = requestAnimationFrame(animateCount);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(animateCount);

    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, duration]); // Run once when component mounts with specific endValue

  return count;
}
