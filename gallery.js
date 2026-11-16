const byId = (id) => document.getElementById(id);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

const viewer = byId('viewer');
const viewerContent = byId('viewer-content');
const viewerTitle = byId('viewer-title');

function openViewer(label, media) {
  viewerTitle.textContent = label;
  viewerContent.replaceChildren(media);
  viewer.showModal();
}

viewer.querySelector('.close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});
viewer.addEventListener('close', () => {
  viewerContent.querySelector('video')?.pause();
  viewerContent.replaceChildren();
});

function videoCard(video, primary = false) {
  const title = video.name || video.label;
  const button = node('button', 'video-card');
  button.type = 'button';
  button.setAttribute('aria-label', '播放' + title + (video.name ? '的学员感悟' : ''));
  const frame = node('span', 'video-frame');
  const poster = node('img');
  poster.alt = '';
  poster.src = video.poster;
  poster.loading = primary ? 'eager' : 'lazy';
  const play = node('span', 'play');
  play.setAttribute('aria-hidden', 'true');
  frame.append(poster, play);
  const caption = node('span', 'video-label');
  const minutes = Math.floor(video.duration / 60);
  const seconds = String(video.duration % 60).padStart(2, '0');
  caption.append(node('strong', '', title), node('small', '', minutes + ':' + seconds));
  button.append(frame, caption);
  button.addEventListener('click', () => {
    const player = node('video');
    player.controls = true;
    player.playsInline = true;
    player.poster = video.poster;
    player.src = video.file;
    player.addEventListener('error', () => {
      if (!viewer.open) return;
      const link = node('a', '', '打开视频文件');
      link.href = video.file;
      const message = node('p', '', '视频播放失败，可尝试直接打开。');
      message.append(link);
      viewerContent.replaceChildren(message);
    }, { once: true });
    openViewer(title, player);
    player.play().catch(() => {});
  });
  return button;
}

function artwork(work, owner, index) {
  const title = work.title ? '《' + work.title + '》' : '作品 ' + String(index + 1).padStart(2, '0');
  const label = owner + ' · ' + title;
  const figure = node('figure', 'work');
  const button = node('button');
  button.type = 'button';
  button.setAttribute('aria-label', '放大查看' + label);
  const image = node('img');
  image.src = work.preview;
  image.width = work.w;
  image.height = work.h;
  image.style.setProperty('--work-ratio', work.w / work.h);
  image.style.setProperty('--work-width', work.w + 'px');
  image.alt = label;
  image.loading = 'lazy';
  image.decoding = 'async';
  button.append(image);
  figure.append(button, node('figcaption', '', title + (work.title ? ' · ' + work.kind : '')));
  button.addEventListener('click', () => {
    const large = node('img');
    large.alt = label;
    large.src = work.image;
    openViewer(label, large);
  });
  return figure;
}

function addBackdrop(section, number) {
  const backdrop = node('img', 'ink-backdrop');
  backdrop.alt = '';
  backdrop.loading = 'lazy';
  backdrop.decoding = 'async';
  backdrop.src = 'assets/design/interior/ink-' + String(number).padStart(2, '0') + '.webp';
  section.classList.add('ink-section');
  section.prepend(backdrop);
}

const themeBackgrounds = [4, 6, 8, 23];
const portfolioBackgrounds = [3, 14, 7, 10, 24, 12, 17, 9, 20, 15, 21, 16, 19, 18];

function themeChapter(group, index) {
  const wrapper = node('section', 'theme-group');
  const heading = node('header', 'theme-heading');
  heading.append(node('h3', 'subheading', group.name));
  addBackdrop(heading, themeBackgrounds[index]);
  const grid = node('div', 'theme-gallery');
  group.works.forEach((work, index) => grid.append(artwork(work, group.name, index)));
  wrapper.append(heading, grid);
  return wrapper;
}

function portfolio(student, number) {
  const wrapper = node('article', 'portfolio');
  wrapper.id = 'artist-' + (number + 1);
  const meta = node('header', 'artist-meta');
  const categories = [...new Set(student.works.map((work) => work.kind))].join(' · ');
  meta.append(node('h3', '', student.name), node('p', '', categories));
  const gallery = node('div', 'artist-works');
  student.works.forEach((work, index) => gallery.append(artwork(work, student.name, index)));
  wrapper.append(meta, gallery);
  addBackdrop(wrapper, portfolioBackgrounds[number % portfolioBackgrounds.length]);
  const link = node('a', '', student.name);
  link.href = '#' + wrapper.id;
  return { wrapper, link };
}

for (const [id, background] of [['reflections', 2], ['behind', 13]]) {
  addBackdrop(byId(id).parentElement, background);
}

for (const video of EXHIBIT.videos) {
  const destinations = { intro: 'intro-video', reflection: 'reflections', behind: 'behind' };
  byId(destinations[video.section]).append(videoCard(video, video.section === 'intro'));
}

byId('themes').append(...EXHIBIT.theme.map(themeChapter));

const surnamesByInitial = {
  C: '陈', D: '董', H: '韩何洪黄', J: '蒋', L: '李刘',
  M: '马', P: '潘', Q: '齐', S: '沈宋孙', T: '陶田屠',
  W: '王魏吴', X: '徐', Y: '闫杨姚于岳', Z: '臧张赵朱左',
};
const surnameInitials = new Map(Object.entries(surnamesByInitial)
  .flatMap(([initial, surnames]) => [...surnames].map(surname => [surname, initial])));
const artistGroups = new Map();

for (const [number, student] of EXHIBIT.students.entries()) {
  const { wrapper, link } = portfolio(student, number);
  byId('portfolios').append(wrapper);

  const initial = surnameInitials.get(student.name[0]) ?? '其他';
  if (!artistGroups.has(initial)) artistGroups.set(initial, []);
  artistGroups.get(initial).push(link);
}

const nameOrder = new Intl.Collator('zh-CN-u-co-pinyin');
for (const initial of [...Object.keys(surnamesByInitial), '其他']) {
  const links = artistGroups.get(initial);
  if (!links) continue;

  const row = node('div', 'artist-index-row');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', initial);
  const label = node('span', 'artist-index-letter', initial);
  label.setAttribute('aria-hidden', 'true');
  const names = node('div', 'artist-index-names');
  names.append(...links.sort((a, b) => nameOrder.compare(a.textContent, b.textContent)));
  row.append(label, names);
  byId('artist-index').append(row);
}

