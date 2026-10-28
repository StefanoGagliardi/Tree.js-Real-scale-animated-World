export const getWebSiteUrl = (): string => {
  // console.log('process.env.HEROKU: ', process.env.HEROKU);
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    if (process.env.HEROKU) {
      return 'https://next-generation-developers.herokuapp.com';
    } else {
      return 'https://gagliardistefano-fe.vercel.app';
    }
  } else {
    return 'http://localhost:3000';
  }
};
