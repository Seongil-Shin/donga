const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

// 숫자를 받고, 1000단위마다 , 를 추가함
function numberWithCommas(x) {
   return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 8개의 값을 가지는 배열을 받고, 현재 디바이스 사이즈에 맞춰 값을 반환.
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

const root = document.getElementById("root");
