const http = require('http');
const { exec } = require('child_process');

// Create function to check if server is running
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

// Create function to check if server is running
isServerRunning(3000, (running) => {
  if (!running) {
    console.log('Starting development server...');
    exec('npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  } else {
    console.log('Server is already running');
  }
});

// Check if server is already running
