const os = require('os-utils');
const http = require('http');

const metrics = {
  cpu: {
    usage: 0,
    history: Array(60).fill(0), // Store last 60 seconds of data
  },
  memory: {
    usage: 0,
    total: os.totalmem(),
    free: os.freemem(),
    history: Array(60).fill(0),
  },
};

// Update metrics every second
setInterval(() => {
  // Get CPU usage
  os.cpuUsage((usage) => {
    metrics.cpu.usage = usage * 100;
    metrics.cpu.history.push(usage * 100);
    metrics.cpu.history.shift();
  });

  // Get memory usage
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  const memUsage = (usedMem / totalMem) * 100;

  metrics.memory.usage = memUsage;
  metrics.memory.free = freeMem;
  metrics.memory.history.push(memUsage);
  metrics.memory.history.shift();
}, 1000);

// Create HTTP server for metrics
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/api/system/metrics') {
    res.end(JSON.stringify(metrics));
  } else if (req.url === '/api/system/cpu') {
    res.end(JSON.stringify({
      usage: metrics.cpu.usage,
      history: metrics.cpu.history,
    }));
  } else if (req.url === '/api/system/memory') {
    res.end(JSON.stringify({
      usage: metrics.memory.usage,
      total: metrics.memory.total,
      free: metrics.memory.free,
      history: metrics.memory.history,
    }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(3001, () => {
  console.log('System metrics server running on port 3001');
}); 