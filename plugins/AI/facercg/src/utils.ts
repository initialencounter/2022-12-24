import { Element } from "koishi";


export function getImgUrl(
  elements: Element[],
  quoteElements: Element[],
): string {
  let img_url: string = "";
  elements.push(...(quoteElements || []));
  for (var i of elements) {
    if (i.type === "img") {
      img_url = i.attrs.src;
      break;
    }
  }
  return img_url;
}
