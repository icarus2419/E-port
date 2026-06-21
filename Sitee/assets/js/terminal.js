export function initTerminal() {
  const snippets = [
    ['<em>const</em> developer = {', '&nbsp;&nbsp;name: "Joseph",', '&nbsp;&nbsp;focus: ["Web", "APIs", "UX"]', '}'],
    ['<em>while</em> (learning) {', '&nbsp;&nbsp;build(newProjects);', '&nbsp;&nbsp;improve(skills);', '}'],
    ['<em>ship</em>({', '&nbsp;&nbsp;frontend: "polished",', '&nbsp;&nbsp;backend: "reliable",', '&nbsp;&nbsp;impact: true', '});']
  ];
  let snippetIndex = 0;
  const terminal = document.getElementById('terminalText');
  const miniRun = document.getElementById('miniRun');
  miniRun?.addEventListener('click', () => {
    snippetIndex = (snippetIndex + 1) % snippets.length;
    if (terminal) terminal.innerHTML = snippets[snippetIndex].map((line) => `<p>${line}</p>`).join('');
  });

  document.querySelectorAll('.deal-button').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.poker-art')?.classList.toggle('dealt');
    });
  });
}
