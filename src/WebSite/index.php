<?php
require_once('vendor/autoload.php');

use Slim\Slim;

function main() {
	$app = new Slim(array(
		'mode' => 'dev',
		'debug' => false,
		'view' => new \Slim\Views\Twig()
	));
	$view = $app->view();
	$view->parserOptions = array(
		'charset' => 'utf-8',
		'cache' => realpath('/tmp'),
		'auto_reload' => true,
		'strict_variables' => false,
		'autoescape' => true
	);
	$view->parserExtensions = array(
		new \Slim\Views\TwigExtension()
	);

	// Define routes
	$app->get('/', function () use ($app) {
		// Sample log message
// 		$app->log->info("Slim-Skeleton '/' route");
		// Render index view
		$app->render('index.html');
		exit;
	});
	
// 	$app->get('/hello/:name', function($name) {
// 		echo "Hello, $name";
// 	});
	$app->run();
}
main();