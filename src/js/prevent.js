const preventContainerOffsetT =
   document.getElementById("prevent-container").offsetTop;
const preventImageElements = [
   {
      ele: document.getElementsByClassName("prevent-image-house")[0],
      speed: 1,
      show: 1,
      html: "<b>집</b> <br /><br />\
      외출하고 집에 돌아온 뒤에는 손을 씻어야 한다. 흐르는\
      물에 비누로 30초 이상 손을 씻는 것이 좋다. 동거인이\
      감기 증상을 보일 경우 식사를 따로 하고, 수건 등을\
      같이 쓰지 않는 것이 좋다.",
   },
   {
      ele: document.getElementsByClassName("prevent-image-bus")[0],
      speed: 1.4,
      show: 26.25,
      html: "<b>대중교통</b> <br /><br />\
      대중교통이 붐비는 출퇴근 시간은 피하고, 가까운 거리를\
      이동할 경우 걷는 것도 좋다. 대중교통을 이용한 뒤에는\
      손소독제를 사용하면 좋다.",
   },
   {
      ele: document.getElementsByClassName("prevent-image-school")[0],
      speed: 1,
      show: 54,
      html: "<b>학교</b> <br /><br />\
      등교 전 건강상태를 확인한다. 발열 등 코로나19 의심\
      증상이 있을 경우 등교하지 않는다. 교실에서는 상시\
      마스크를 착용한다. 또한 교실을 수시로 환기하는 것이\
      중요하다.",
   },
];
var pv_lastShowTextIdx = -1;
var prevent_fixedTextEle = document.getElementsByClassName("prevent-fixed")[0];
var prevent_scene = document.getElementsByClassName("prevent-scene")[0];
function handlePreventScroll(e) {
   const curOffset = e.target.scrollTop - preventContainerOffsetT;
   if (curOffset > 0) {
      preventEntered = true;
      prevent_scene.setAttribute(
         "style",
         `transform: translateX(-${curOffset * 0.2}px)`
      );
      preventImageElements.forEach((item, idx) => {
         item.ele.setAttribute(
            "style",
            `transform: translateX(-${curOffset * item.speed}px)`
         );

         if (curOffset >= item.show * rem && pv_lastShowTextIdx !== idx) {
            if (window.innerWidth <= 30 * rem) {
               prevent_fixedTextEle.innerHTML = item.html;
            } else {
               if (pv_lastShowTextIdx !== -1) {
                  preventImageElements[
                     pv_lastShowTextIdx
                  ].ele.childNodes[1].classList.remove("prevent-show-text");
               }
               item.ele.childNodes[1].classList.add("prevent-show-text");
            }
            pv_lastShowTextIdx = idx;
         }
      });
   } else if (pv_lastShowTextIdx !== -1) {
      prevent_fixedTextEle.innerHTML = "";
      preventImageElements[
         pv_lastShowTextIdx
      ].ele.childNodes[1].classList.remove("prevent-show-text");
      pv_lastShowTextIdx = -1;
   }
}

root.addEventListener("scroll", handlePreventScroll);
