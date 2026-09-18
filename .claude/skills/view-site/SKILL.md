# View Portfolio Site in Development

description: View the WordPress portfolio site running locally via Elementor

## Prerequisites

- **Local by Flywheel** must be running
- The "andres-portfolio-local" site must be started in Local

## Accessing the Site

The site is accessible at:
```
https://andres-portfolio-local.local/
```

### Quick Access
```bash
# View the homepage
curl -s "https://andres-portfolio-local.local/" --insecure | head -100

# Or open in browser
open https://andres-portfolio-local.local/
```

## Technology Stack

- **CMS**: WordPress 7.1.1
- **Page Builder**: Elementor 4.2.4
- **Theme**: Hello Elementor 3.4.9
- **Additional Plugins**:
  - JEG Elementor Kit
  - ElementsKit Lite
  - Disable Gutenberg
  - Smooth Back to Top Button

## Key Pages

- **Home**: https://andres-portfolio-local.local/
- **About Me**: https://andres-portfolio-local.local/about-me/
- **Projects**: https://andres-portfolio-local.local/projects/
  - Robotics: https://andres-portfolio-local.local/robotics/
  - Programming: https://andres-portfolio-local.local/programming/
  - Electrical/Embedded: https://andres-portfolio-local.local/electrical-embedded/
  - Mechanical: https://andres-portfolio-local.local/mechanical/

## Design Notes

- **Background**: Dark theme (#1E2736)
- **Headings**: Purple-to-green gradient (#AB83FE → #4FCF9C)
- **Framework**: Elementor-based responsive design

## Editing the Site

To edit pages and design:
1. Log in to WordPress admin: https://andres-portfolio-local.local/wp-admin/
2. Edit pages with Elementor drag-and-drop editor
3. Changes are reflected immediately on the live site

## Front-End Development

If making CSS/JS changes outside Elementor:
- Custom CSS is in wp-content/themes/hello-elementor/assets/css/
- Custom JS is in wp-content/themes/hello-elementor/assets/js/
- Elementor caches CSS; clear cache if changes don't appear
