module.exports = {
  packagerConfig: {
    asar: true,
    icon: "build/icon"
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: "build/icon.ico"
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        "icon":"build/icon"
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        "icon": "build/CYaPass.png" 
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
