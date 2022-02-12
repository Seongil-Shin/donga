var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

function numberWithCommas(x) {
   return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function returnVariableByWidth(array) {
   if (matchMedia("screen and (max-width: 450px)").matches) {
      return array[0];
   } else if (matchMedia("screen and (max-width: 640px)").matches) {
      return array[1];
   } else if (matchMedia("screen and (max-width: 768px)").matches) {
      return array[2];
   } else if (matchMedia("screen and (max-width: 1024px)").matches) {
      return array[3];
   } else if (matchMedia("screen and (max-width: 1280px)").matches) {
      return array[4];
   } else if (matchMedia("screen and (max-width: 1546px)").matches) {
      return array[5];
   } else if (matchMedia("screen and (max-width: 1920px)").matches) {
      return array[6];
   } else {
      return array[7];
   }
}

// 객체 깊은 복사를 위한 함수
function deepCopyObject(inObject) {
   var outObject, value, key;
   if (typeof inObject !== "object" || inObject === null) {
      return inObject;
   }
   outObject = Array.isArray(inObject) ? [] : {};
   for (key in inObject) {
      value = inObject[key];
      outObject[key] =
         typeof value === "object" && value !== null
            ? deepCopyObject(value)
            : value;
   }
   return outObject;
}

// 툴팁 밖으로 나갔을때 안으로 넣는 과정 추가
function calcTooltlpLeft(origin) {
   var tooltipLeft = origin;
   if (tooltipLeft + 250 + 2 * rem > window.innerWidth) {
      tooltipLeft -= tooltipLeft + 250 + 2 * rem - window.innerWidth + 10;
   }
   return tooltipLeft;
}

// 스크롤 이벤트 등록
// scroll element by section
var lastScrollTop = 0;
var canTriggerScrollToSection = [
   [true, true, true, true],
   [true, true, true, true],
];
var scrollToSectionObj = [
   [
      { to: "map-container", heightFrom: 0, heightTo: 1 },
      { to: "nations-container", heightFrom: 5, heightTo: 6 },
      { to: "graph-container", heightFrom: 6, heightTo: 7 },
   ],
   [
      { to: "landing-container", heightFrom: 0, heightTo: 1 },
      { to: "map-container", heightFrom: 5, heightTo: 6 },
      { to: "nations-container", heightFrom: 6, heightTo: 7 },
   ],
];
function scrollToSection(section) {
   var sectionTop = document.getElementById(section).offsetTop;
   root.scrollTo({
      top: sectionTop,
      behavior: "smooth",
   });
}
function initCanTriggerScrollToSection() {
   canTriggerScrollToSection = [
      [true, true, true, true],
      [true, true, true, true],
   ];
}
function scrollEvent(e) {
   var scrollTop = e.target.scrollTop;
   if (scrollTop > lastScrollTop) {
      scrollToSectionObj[0].forEach((item, idx) => {
         if (
            scrollTop > window.innerHeight * item.heightFrom &&
            scrollTop < item.heightTo * window.innerHeight &&
            canTriggerScrollToSection[0][idx]
         ) {
            scrollToSection(item.to);
            initCanTriggerScrollToSection();
            canTriggerScrollToSection[0][idx] = false;
         }
      });
   } else {
      scrollToSectionObj[1].forEach((item, idx) => {
         if (
            scrollTop > window.innerHeight * item.heightFrom &&
            scrollTop < item.heightTo * window.innerHeight &&
            canTriggerScrollToSection[1][idx]
         ) {
            scrollToSection(item.to);
            initCanTriggerScrollToSection();
            canTriggerScrollToSection[1][idx] = false;
         }
      });
   }
   lastScrollTop = scrollTop;
}

var root = document.getElementById("root");
