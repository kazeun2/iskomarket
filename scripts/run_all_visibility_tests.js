const { spawn } = require('child_process');
const scripts = [
  { cmd: 'node', args: ['scripts/check_missing_user_profiles.js'], name: 'check_missing_user_profiles' },
  { cmd: 'node', args: ['scripts/verify_products_fk.js'], name: 'verify_products_fk' },
  { cmd: 'node', args: ['scripts/e2e_products_visibility_missing_profile.js'], name: 'e2e_missing_profile' },
  { cmd: 'node', args: ['scripts/e2e_products_visibility.js'], name: 'e2e_products_visibility' }
];

async function runScript(script) {
  return new Promise((resolve) => {
    console.log(`\n--- Running: ${script.name} ---`);
    const p = spawn(script.cmd, script.args, { stdio: 'inherit', shell: true });
    p.on('close', (code) => {
      console.log(`--- ${script.name} exited with code ${code} ---`);
      resolve(code);
    });
  });
}

(async () => {
  const results = {};
  for (const s of scripts) {
    const code = await runScript(s);
    results[s.name] = code;
    if (code !== 0) {
      console.error(`Script ${s.name} failed (exit ${code}), stopping run.`);
      process.exit(code);
    }
  }
  console.log('\nAll visibility tests completed successfully:', results);
})();
