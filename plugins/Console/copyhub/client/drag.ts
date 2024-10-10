function dragenterEvent(event: Event) {
  event.stopPropagation();
  event.preventDefault();
}

async function dragoverEvent(event: Event) {
  event.stopPropagation();
  event.preventDefault();
}

function dragleaveEvent(event: Event) {
  event.stopPropagation();
  event.preventDefault();
}

export { dragenterEvent, dragoverEvent, dragleaveEvent }
