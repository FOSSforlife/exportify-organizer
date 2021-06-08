const JSZip = require('jszip');
const parse = require('csv-parse/lib/sync')
const fs = require('fs-extra');
const path = require('path');

const DEFAULT_INPUT_FILE = '/home/elias/Downloads/spotify_playlists.zip';
const SPOTIFY_USER = 'spotify:user:l4xz9k88ino2imr81wom61l1y';
const SORT_ALL = true;

function getPlaylistCategory(tracks) {
  const users = tracks.map(t => t['Added By']);
  if(users.includes(SPOTIFY_USER)) {
    return users.find(u => u !== SPOTIFY_USER) ? 'collaborative' : 'created';
  }
  else {
    return 'following';
  }
}

function getPlaylistUpdatedDate(tracks) {
  return new Date(Math.max(...tracks.map(t => new Date(t['Added At']))));
}

(async () => {
  const inputFile = process.argv[2] ?? DEFAULT_INPUT_FILE;
  const fileData = fs.readFileSync(inputFile);
  const zipData = await JSZip.loadAsync(fileData);
  // TODO: refactor to for await
  await Promise.all(
    Object.values(zipData.files).map(async z => {
      const csvString = await z.async('string');
      return Promise.resolve([csvString, z.name]).then(([csvString, filename]) => {
          const tracks = parse(csvString.toString(), {columns: true});
          const pathArr = ['output', getPlaylistCategory(tracks)];
          if(SORT_ALL) { // add the year
            pathArr.push(getPlaylistUpdatedDate(tracks).getFullYear().toString());
          }
          fs.mkdirpSync(path.join(...pathArr))
          console.log(pathArr);
          fs.writeFileSync(path.join(...pathArr, filename), csvString);
      });
  }));
})();
