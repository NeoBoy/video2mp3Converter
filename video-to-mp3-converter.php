<?php
/**
 * Plugin Name: Video to MP3 Converter
 * Plugin URI: https://yoursite.com/video-to-mp3-converter
 * Description: Convert local video files and YouTube videos to MP3. Uses ffmpeg.wasm for local files and optional microservice for YouTube.
 * Version: 2.0.0
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
define('V2MP3_VERSION', '2.0.0');
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
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
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
            
            // Load FFmpeg ES modules first
            add_action('wp_footer', function() {
                ?>
                <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"></script>
                <script>
                    const { createFFmpeg, fetchFile } = FFmpeg;
                    window.createFFmpeg = createFFmpeg;
                    window.fetchFile = fetchFile;
                </script>
                <?php
            }, 5);
            
            // Enqueue main JavaScript as module
            wp_enqueue_script(
                'v2mp3-script',
                V2MP3_PLUGIN_URL . 'assets/js/converter-legacy.js',
                array(),
                V2MP3_VERSION,
                true
            );
            
            // No need for module type attribute with 0.11.6
            
            // Pass data to JavaScript
            wp_localize_script('v2mp3-script', 'v2mp3Data', array(
                'pluginUrl' => V2MP3_PLUGIN_URL,
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'microserviceUrl' => get_option('v2mp3_microservice_url', ''),
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
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Video to MP3 Converter Settings',
            'Video to MP3',
            'manage_options',
            'video-to-mp3-converter',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('v2mp3_settings', 'v2mp3_microservice_url', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_url'),
            'default' => ''
        ));
        
        add_settings_section(
            'v2mp3_main_section',
            'YouTube Conversion Settings',
            array($this, 'render_section_info'),
            'video-to-mp3-converter'
        );
        
        add_settings_field(
            'v2mp3_microservice_url',
            'Microservice URL',
            array($this, 'render_microservice_url_field'),
            'video-to-mp3-converter',
            'v2mp3_main_section'
        );
    }
    
    /**
     * Sanitize URL
     */
    public function sanitize_url($url) {
        $url = trim($url);
        if (empty($url)) {
            return '';
        }
        return esc_url_raw($url, array('http', 'https'));
    }
    
    /**
     * Render section info
     */
    public function render_section_info() {
        echo '<p>Configure the external microservice for YouTube video conversion.</p>';
        echo '<p><strong>Note:</strong> YouTube conversion requires a separate microservice. See the plugin documentation for setup instructions.</p>';
    }
    
    /**
     * Render microservice URL field
     */
    public function render_microservice_url_field() {
        $url = get_option('v2mp3_microservice_url', '');
        echo '<input type="url" name="v2mp3_microservice_url" value="' . esc_attr($url) . '" class="regular-text" placeholder="https://your-microservice.onrender.com">';
        echo '<p class="description">Enter the URL of your deployed microservice (without trailing slash).<br>Example: <code>https://youtube-converter.onrender.com</code></p>';
        
        if (!empty($url)) {
            echo '<p class="description">Testing connection... <span id="v2mp3-test-result"></span></p>';
            echo '<script>
                fetch("' . esc_js($url) . '/health")
                    .then(r => r.json())
                    .then(d => {
                        document.getElementById("v2mp3-test-result").innerHTML = "<span style=\"color: green;\">✓ Connected</span>";
                    })
                    .catch(e => {
                        document.getElementById("v2mp3-test-result").innerHTML = "<span style=\"color: red;\">✗ Connection failed</span>";
                    });
            </script>';
        }
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        if (isset($_GET['settings-updated'])) {
            add_settings_error('v2mp3_messages', 'v2mp3_message', 'Settings Saved', 'updated');
        }
        
        settings_errors('v2mp3_messages');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <div style="background: #fff; border-left: 4px solid #00a0d2; padding: 12px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📦 Microservice Setup Instructions</h3>
                <ol>
                    <li>Navigate to the <code>microservice</code> folder in your plugin directory</li>
                    <li>Deploy to Render, Railway, or another hosting service (see README.md)</li>
                    <li>Copy your deployed service URL</li>
                    <li>Paste it in the field below and save</li>
                </ol>
                <p><strong>Local files</strong> will be converted using the browser (ffmpeg.wasm).<br>
                <strong>YouTube URLs</strong> will be sent to your microservice for conversion.</p>
            </div>
            
            <form action="options.php" method="post">
                <?php
                settings_fields('v2mp3_settings');
                do_settings_sections('video-to-mp3-converter');
                submit_button('Save Settings');
                ?>
            </form>
            
            <div style="margin-top: 30px; padding: 15px; background: #f0f0f1; border-radius: 4px;">
                <h3>Usage</h3>
                <p>Add this shortcode to any page or post:</p>
                <code style="background: #fff; padding: 8px 12px; display: inline-block;">[video_to_mp3]</code>
                <h4 style="margin-top: 20px;">Supported Sources:</h4>
                <ul>
                    <li>✓ Local video files (MP4, WebM, AVI, MOV, etc.)</li>
                    <li>✓ YouTube URLs (requires microservice configuration)</li>
                    <li>✓ Direct video URLs (with CORS enabled)</li>
                </ul>
            </div>
        </div>
        <?php
    }
}

// Initialize the plugin
new VideoToMP3Converter();
