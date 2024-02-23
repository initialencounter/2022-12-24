import { Session,Element} from "koishi"
import { Face_info, Location } from "./type"

export const div_items = (face_arr: Face_info[]): Element[] => {
    const style_arr: string[] = []
    for (var i in face_arr) {
      var location: Location = face_arr[i].location
      var style_str: string = `transform: rotate(${location.rotation}deg);position: absolute;font-size: 10px;width: ${location.width}px;height: ${location.height}px;left: ${location.left}px;top: ${location.top}px;rotation: ${location.rotation}deg;background: transparent;border: 5px solid green`
      style_arr.push(style_str)
    }
    const res: Element[] = style_arr.map((style, id) =>
      <div style={style}>face{id}</div>
    )
    return res
  }
  
  
  export const msg = (face_arr: Face_info[]): Element[] => {
    const msg_arr: string[] = []
    for (var i in face_arr) {
      var gender = face_arr[i].gender
      var beauty = face_arr[i].beauty
      msg_arr.push(`第${i}张脸,颜值:${beauty} 性别:${gender.type}｜概率:${gender.probability}`)
    }
    const res: Element[] = msg_arr.map((text, id) =>
      <p>{text}</p>
    )
    return res
  }
  
export function getImgUrl(elements: Element[]): string {
    let img_url: string
    for (var i of elements) {
        if (i.type === 'img') {
            img_url = i.attrs.src
            break
        }
    }
    return img_url
}