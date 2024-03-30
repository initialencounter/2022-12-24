const axios = require('axios');
const fs = require('fs')
const url = 'https://github.com/initialencounter?action=show&controller=profiles&tab=contributions&user_id=initialencounter';

const headers = {
  'X-Requested-With': 'XMLHttpRequest'
};
const username = 'initialencounter'
axios({url:`https://github.com/${username}?action=show&controller=profiles&tab=contributions&user_id=${username}`,
method: "GET",
headers:{
  'X-Requested-With': 'XMLHttpRequest',
  'Cookie':"logged_in=yes;tz=Asia%2FShanghai;"
}})
// axios.get(url, { headers })
  .then(response => {
    fs.writeFileSync('test2.html',response.data)
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });