const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

const readSettings = () => {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return {};
  }
};

const writeSettings = (data) => {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
};

const REMOTE_SECRET = process.env.REMOTE_ADMIN_SECRET || 'super-secret-remote-key';

// GET /api/remote/theme — Get remote theme config
const getRemoteThemeConfig = (req, res) => {
  const settings = readSettings();
  res.json({
    theme: settings.theme || 'warm-cafe',
    customColors: settings.customColors || {},
    cafeName: settings.cafeName || 'Brew & Bites',
    showFestivalBanner: settings.showFestivalBanner || false,
    festivalSaleName: settings.festivalSaleName || 'Diwali Light-Up Sale',
    cardCornerStyle: settings.cardCornerStyle || 'rounded-full',
    menuItemCornerStyle: settings.menuItemCornerStyle || 'rounded-md',
    allowedThemes: ['warm-cafe', 'midnight', 'clean-pro', 'forest', 'sweet-pink', 'shopify-crave', 'neo-brutalism'],
    remoteControlActive: true,
  });
};

// POST/PUT /api/remote/theme — Update theme config remotely from another site
const updateRemoteThemeConfig = (req, res) => {
  try {
    const providedSecret = req.headers['x-remote-secret'] || req.body.secret;
    if (providedSecret !== REMOTE_SECRET) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing X-Remote-Secret header' });
    }

    const current = readSettings();
    const {
      theme,
      customColors,
      cafeName,
      showFestivalBanner,
      festivalSaleName,
      cardCornerStyle,
      menuItemCornerStyle,
    } = req.body;

    const allowedThemes = ['warm-cafe', 'midnight', 'clean-pro', 'forest', 'sweet-pink', 'shopify-crave', 'neo-brutalism'];

    if (theme && !allowedThemes.includes(theme)) {
      return res.status(400).json({
        error: `Invalid theme '${theme}'. Allowed themes: ${allowedThemes.join(', ')}`,
      });
    }

    const updated = {
      ...current,
      ...(theme !== undefined && { theme }),
      ...(customColors !== undefined && { customColors }),
      ...(cafeName !== undefined && { cafeName }),
      ...(showFestivalBanner !== undefined && { showFestivalBanner: showFestivalBanner === true || showFestivalBanner === 'true' }),
      ...(festivalSaleName !== undefined && { festivalSaleName }),
      ...(cardCornerStyle !== undefined && { cardCornerStyle }),
      ...(menuItemCornerStyle !== undefined && { menuItemCornerStyle }),
    };

    writeSettings(updated);

    res.json({
      success: true,
      message: `Store theme updated remotely to '${updated.theme || 'warm-cafe'}'!`,
      settings: updated,
    });
  } catch (err) {
    res.status(500).json({ error: 'Remote theme update failed' });
  }
};

module.exports = { getRemoteThemeConfig, updateRemoteThemeConfig };
