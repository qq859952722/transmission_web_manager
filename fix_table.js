const fs = require('fs');
const file = 'src/components/TorrentTable/TorrentTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// The block to replace is inside <Index each={...}>
// Let's replace the whole inner function
const oldBlock = `              {(virtualRowAccessor) => {
                const virtualRow = virtualRowAccessor();
                const torrent = sortedTorrentsList()[virtualRow.index];
                const isSelected = createMemo(() => selectedIds().includes(torrent.id));

                const handleDoubleClick = () => {
                  if (torrent.status === 0) startTorrents([torrent.id]);
                  else pauseTorrents([torrent.id]);
                };`;

const newBlock = `              {(virtualRowAccessor) => {
                const virtualRow = virtualRowAccessor;
                const torrent = () => sortedTorrentsList()[virtualRow().index];
                const isSelected = createMemo(() => selectedIds().includes(torrent().id));

                const handleDoubleClick = () => {
                  if (torrent().status === 0) startTorrents([torrent().id]);
                  else pauseTorrents([torrent().id]);
                };`;

content = content.replace(oldBlock, newBlock);

// Now for the rest of the block (from line 271 to 426)
// We replace all instances of `torrent.` with `torrent().`
// But we must be careful not to replace `torrentStore` or similar, but the variable is exactly `torrent.`
// Since the variable is strictly `torrent.`, we can just replace all `torrent.` with `torrent().` globally in the file?
// Wait, no. We can find the start of the `return (` statement inside the Index and replace it up to the end of the Index.
let startIdx = content.indexOf('                return (\n                  <div\n                    class={cn(');
let endIdx = content.indexOf('            </Index>');

if (startIdx !== -1 && endIdx !== -1) {
    let innerContent = content.substring(startIdx, endIdx);
    // Replace torrent. with torrent().
    innerContent = innerContent.replace(/torrent\./g, 'torrent().');
    content = content.substring(0, startIdx) + innerContent + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find boundaries.");
}
