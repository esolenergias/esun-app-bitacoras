<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Esol_AI {
    private static $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public static function call_gemini( $prompt ) {
        $api_key = get_theme_mod( 'esol_gemini_api_key' );
        if ( ! $api_key ) return new WP_Error( 'no_api_key', 'API Key missing' );

        $response = wp_remote_post( self::$endpoint . '?key=' . $api_key, [
            'headers' => [ 'Content-Type' => 'application/json' ],
            'body'    => json_encode([
                'contents' => [[ 'parts' => [[ 'text' => $prompt ]] ]]
            ]),
            'timeout' => 30
        ]);

        if ( is_wp_error( $response ) ) return $response;

        $response_code = wp_remote_retrieve_response_code( $response );
        if ( $response_code !== 200 ) {
            $err_body = json_decode( wp_remote_retrieve_body( $response ), true );
            $msg = $err_body['error']['message'] ?? 'API Error ' . $response_code;
            return new WP_Error( 'api_error', $msg );
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
        
        return $text;
    }
}
