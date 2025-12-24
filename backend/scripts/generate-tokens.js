import crypto from 'crypto';

// Generate invite tokens for participants
const count = process.argv[2] ? parseInt(process.argv[2]) : 10;

console.log(`Генерирую ${count} invite токенов:\n`);

for (let i = 0; i < count; i++) {
  const token = crypto.randomBytes(16).toString('hex');
  const url = `http://localhost:3000/join/${token}`;
  console.log(`${i + 1}. ${token}`);
  console.log(`   URL: ${url}\n`);
}

console.log('\nСкопируй эти токены и отправь участникам!');

