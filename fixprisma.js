const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 检查是否存在临时文件
const prismaDir = path.join(__dirname, 'node_modules', '.prisma', 'client');
const tempFiles = fs.readdirSync(prismaDir).filter(file => file.includes('.tmp'));

if (tempFiles.length > 0) {
  console.log('发现临时文件，正在清理...');
  tempFiles.forEach(file => {
    try {
      fs.unlinkSync(path.join(prismaDir, file));
      console.log(`已删除: ${file}`);
    } catch (err) {
      console.error(`无法删除 ${file}: ${err.message}`);
    }
  });
} else {
  console.log('未发现临时文件');
}

// 重新生成Prisma客户端
console.log('重新生成Prisma客户端...');
const generateProcess = spawn('npx', ['prisma', 'generate']);

generateProcess.stdout.on('data', (data) => {
  console.log(`输出: ${data}`);
});

generateProcess.stderr.on('data', (data) => {
  console.error(`错误: ${data}`);
});

generateProcess.on('close', (code) => {
  console.log(`进程退出，代码: ${code}`);
});

// 保存启动脚本
const startScript = `
const http = require('http');
const { exec } = require('child_process');

// 创建检查服务器是否在运行的函数
function isServerRunning(port, callback) {
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'HEAD',
    timeout: 1000
  };

  const req = http.request(options, (res) => {
    callback(true);
  });

  req.on('error', () => {
    callback(false);
  });

  req.end();
}

// 检查服务器是否已在运行
isServerRunning(3000, (running) => {
  if (!running) {
    console.log('启动开发服务器...');
    exec('npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.error(\`执行错误: \${error}\`);
        return;
      }
      console.log(\`stdout: \${stdout}\`);
      console.error(\`stderr: \${stderr}\`);
    });
  } else {
    console.log('服务器已经在运行');
  }
});
`;

fs.writeFileSync(path.join(__dirname, 'start-dev.js'), startScript);
console.log('创建了start-dev.js脚本'); 