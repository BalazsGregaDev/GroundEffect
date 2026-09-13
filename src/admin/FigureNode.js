import { Node } from '@tiptap/core'

export const FigureNode = Node.create({
  name: 'figure',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      caption: { default: '' },
      ratio: { default: '16-9' },
      orientation: { default: 'fekvo' },
      size: { default: 'kozepes' },
      wrap: { default: false },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-kep]',
        getAttrs: (element) => ({
          src: element.querySelector('img')?.getAttribute('src'),
          caption: element.querySelector('figcaption')?.textContent ?? '',
          ratio: element.dataset.arany,
          orientation: element.dataset.allas,
          size: element.dataset.meret,
          wrap: element.dataset.korbefut === 'igen',
        }),
      },
    ]
  },

  renderHTML({ node }) {
    const { src, caption, ratio, orientation, size, wrap } = node.attrs

    const figure = [
      'figure',
      {
        'data-kep': '',
        'data-arany': ratio,
        'data-allas': orientation,
        'data-meret': size,
        'data-korbefut': wrap ? 'igen' : 'nem',
        class: 'cikk-kep',
      },
      ['img', { src, alt: caption }],
    ]

    if (caption) {
      figure.push(['figcaption', {}, caption])
    }

    return figure
  },
})
