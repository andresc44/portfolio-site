<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'local' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', 'root' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          ' 0LWn#3-R*0ONG!pc/0jN].%])QjSro p;o{<<`8;68j>%bu,v*|Jzzj5R(lYFbi' );
define( 'SECURE_AUTH_KEY',   'gfaAkJpmyw[&>s H#Fab K>:ksiBv4tzTwSBIxnCkvbgEMgK @Y:o{w<iRx?QfIq' );
define( 'LOGGED_IN_KEY',     'y.zkNq?UN4{|o*SEfC(t2#Fu1PW:`_6Q{Co(mC-Nu`GAJ]$`o>}~ Gj7Ukpz>FD?' );
define( 'NONCE_KEY',         'bF0KBwB^*s=S%U]!LUD!e.M^<Abd5u$A+5*^/idgjh~M~u9%^(?;d5>mK7cRY;hx' );
define( 'AUTH_SALT',         'uEfmc7x,AJ=w]3B]rq;-;:Y}MNLjUAf%/|8&^rXB=$Pq46S4O#vb>A>(H}qGiPR|' );
define( 'SECURE_AUTH_SALT',  '{<=$E$X00bP1-Nz8A36x-x2x*8`dPoYS`/ZZ$RZe);5egg$!*zq 84Gv<)5Du#r2' );
define( 'LOGGED_IN_SALT',    '#I_qi*hc6;<MZoU2`}Rc0pG w!n/+<MWK7*) U1E~Y@zK/, Yd]C4~^26S>7^<V6' );
define( 'NONCE_SALT',        'kLBH:`bw]B}ouR13LDf&>%5}t<%BFIv#ea@vFP8IHIc~gHTe]RYXhG@^F(sqGmlC' );
define( 'WP_CACHE_KEY_SALT', 'r?_?%L=lY][.9#f8!Y99Y{^o4l)we40$=[%tTVS%m1&Q1 QR$j5ctR<dzZpQ&QEg' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = '1789726210_wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

define( 'WP_ENVIRONMENT_TYPE', 'local' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
