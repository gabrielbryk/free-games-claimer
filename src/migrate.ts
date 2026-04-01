import { existsSync } from 'node:fs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { datetime } from './util.ts';

interface MigrateData {
  [user: string]: {
    [game: string]: { time: string; [key: string]: unknown };
  };
}

const datetime_UTCtoLocalTimezone = async (file: string) => {
  if (!existsSync(file)) return console.error('File does not exist:', file);
  const db = new Low<MigrateData>(new JSONFile(file), {});
  await db.read();
  db.data ||= {};
  console.log('Migrating', file);
  for (const user in db.data) {
    for (const game in db.data[user]) {
      const time1 = db.data[user][game].time;
      const time1s = time1.endsWith('Z') ? time1 : time1 + ' UTC';
      const time2 = datetime(new Date(time1s));
      console.log([game, time1, time2]);
      db.data[user][game].time = time2;
    }
  }
  await db.write();
};

const args = process.argv.slice(2);
if (args[0] == 'localtime') {
  const files = args.slice(1);
  console.log('Will convert UTC datetime to local timezone for', files);
  files.forEach(datetime_UTCtoLocalTimezone);
} else {
  console.log('Usage: bun run src/migrate.ts localtime data/*.json');
}
