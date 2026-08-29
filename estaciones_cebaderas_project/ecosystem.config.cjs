module.exports = {
  apps: [{
    name:        'fumiDorado-upc',
    script:      'src/app.js',          
    interpreter: 'node',
    node_args:   '--experimental-vm-modules',
    instances:   1,
    autorestart: true,
    watch:       false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};