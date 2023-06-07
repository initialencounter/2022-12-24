import * as md5 from "spark-md5";
export const getAvatar = (email: string) => {
    if (!email.includes("@"))
      return `http://q2.qlogo.cn/headimg_dl?dst_uin=${email}&spec=100`;
    return (
      "https://s.gravatar.com" +
      "/avatar/" +
      (email
        ? (md5 as unknown as typeof import("spark-md5")).hash(email.toLowerCase())
        : "") +
      ".png?d=mp"
    );
  };

