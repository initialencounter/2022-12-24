function setElement(commands) {
  const page = document.querySelector('#page')
  page.style.backgroundImage = `url(./assets/img/0.jpg)`
  page.style.height = (80 + (Math.ceil(commands.length / 5) * 162)) + 'px'
  const cardsContainer = document.querySelector('#cards-container')
  let cards = ''
  for (let i = 0; i < commands.length; i++) {
    let name = commands[i][0] ?? 'n/a'
    let desc = commands[i][1] ?? 'n/a'
    let card = `
    <li class="card-instance" >
      <div class="card" >
        <img alt="..." class="card-img-top" src="./assets/img/${i + 1}.jpg">
        <div class="card-text" >
        <p class="card-title" >${name}</p>
        <p class="card-desc" >${desc}</p></div>
      </div>
    </li>
`
    cards += card
  }
  cardsContainer.innerHTML = cards
}