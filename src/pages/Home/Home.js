import { useEffect, useState } from "react";

import video1 from "../../assets/videos/main_video1.mp4";
import video2 from "../../assets/videos/main_video2.mp4";
import video3 from "../../assets/videos/main_video3.mp4";

const heroVideos = [
  {
    video: video1,
    number: "01",
    title: ["함께 배우고", "함께 성장하세요."],
    description: ["혼자 공부하지 말고", "새로운 사람들과 함께 시작해보세요."],
    linkText: "스터디 바로가기",
    link: "/study",
  },
  {
    video: video2,
    number: "02",
    title: ["막히는 순간", "멘토에게 물어보세요."],
    description: ["혼자 고민하지 말고", "경험이 있는 멘토와 함께 해결해보세요."],
    linkText: "멘토 찾아보기",
    link: "/mentor",
  },
  {
    video: video3,
    number: "03",
    title: ["같은 목표를 가진", "사람들과 시작하세요."],
    description: ["공부하고 공유하고 질문하면서", "함께 성장해보세요."],
    linkText: "커뮤니티 바로가기",
    link: "/community",
  },
];

function useHeroVideo() {
  const [currentVideo, setCurrentVideo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % heroVideos.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  return { currentVideo, heroVideos };
}

export default useHeroVideo;