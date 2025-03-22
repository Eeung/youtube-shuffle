let interval;

self.onmessage = (event) => {
  if (event.data === "start") {
    interval = setInterval(() => {
      self.postMessage("checkPlayback");
    }, 3000); // 3초마다 재생 상태 체크
  } else if (event.data === "stop") {
    clearInterval(interval);
  }
};