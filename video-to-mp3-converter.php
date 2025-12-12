<?php
/**
 * Plugin Name: Video to MP3 Converter
 * Plugin URI: https://yoursite.com/video-to-mp3-converter
 * Description: A modern client-side video to MP3 converter using ffmpeg.wasm. No server processing required!
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yoursite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: video-to-mp3-converter
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('V2MP3_VERSION', '1.0.0');
define('V2MP3_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('V2MP3_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main Plugin Class
 */
class VideoToMP3Converter {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_shortcode('video_to_mp3', array($this, 'render_converter'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Any initialization code here
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_assets() {
        // Only enqueue on pages that have the shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'video_to_mp3')) {
            // Enqueue CSS
            wp_enqueue_style(
                'v2mp3-styles',
                V2MP3_PLUGIN_URL . 'assets/css/style.css',
                array(),
                V2MP3_VERSION
            );
            
            // Enqueue ffmpeg.wasm from CDN (0.10.1 - no SharedArrayBuffer needed)
            wp_enqueue_script(
                'ffmpeg-core',
                'https://unpkg.com/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js',
                array(),
                '0.10.1',
                true
            );
            
            // Enqueue main JavaScript
            wp_enqueue_script(
                'v2mp3-script',
                V2MP3_PLUGIN_URL . 'assets/js/converter.js',
                array('ffmpeg-core'),
                V2MP3_VERSION,
                true
            );
            
            // Pass data to JavaScript
            wp_localize_script('v2mp3-script', 'v2mp3Data', array(
                'pluginUrl' => V2MP3_PLUGIN_URL,
                'ajaxUrl' => admin_url('admin-ajax.php'),
            ));
        }
    }
    
    /**
     * Render the converter interface
     */
    public function render_converter($atts) {
        ob_start();
        include V2MP3_PLUGIN_DIR . 'templates/converter-template.php';
        return ob_get_clean();
    }
}

// Initialize the plugin
new VideoToMP3Converter();
