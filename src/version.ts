import { log } from 'console';
import { exec } from 'node:child_process';

const execp = (cmd: string): Promise<string> => new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
    if (stderr) console.error(`stderr: ${stderr}`);
    if (error) {
      console.log(`error: ${error.message}`);
      if (error.message.includes('command not found')) {
        console.info('Install git to check for updates!');
      }
      return reject(error);
    }
    resolve(stdout.trim());
  });
});

let sha: string | undefined;
let date: string | undefined;

if (process.env.NOVNC_PORT) {
  log('Running inside Docker.');
  for (const v of ['COMMIT', 'BRANCH', 'NOW']) {
    log(`  ${v}:`, process.env[v]);
  }
  sha = process.env.COMMIT;
  date = process.env.NOW;
} else {
  log('Not running inside Docker.');
  sha = await execp('git rev-parse HEAD');
  date = await execp('git show -s --format=%cD');
}

const gh = await (await fetch('https://api.github.com/repos/vogler/free-games-claimer/commits/main', {})).json() as {
  sha: string;
  commit: { committer: { date: string } };
};

log('Local commit:', sha, date ? new Date(date) : undefined);
log('Online commit:', gh.sha, new Date(gh.commit.committer.date));

if (sha == gh.sha) {
  log('Running the latest version!');
} else {
  log('Not running the latest version!');
}
