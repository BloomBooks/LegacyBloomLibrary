<?php

require_once('vendor/autoload.php');

require_once('mapper/ArrayOf.php');
require_once('mapper/Id.php');
require_once('mapper/IdReference.php');
require_once('mapper/MapOf.php');
require_once('mapper/ReferenceList.php');
require_once('mapper/JsonEncoder.php');
require_once('mapper/JsonDecoder.php');

require_once('palaso/CodeGuard.php');

use models\mapper\JsonDecoder;
use models\mapper\JsonEncoder;
use models\mapper\ArrayOf;

use Httpful\Request;

class IndustryIdentifier {
	public $type;
	
	public $identifier;

}

class ImageLink {
	public $smallThumbnail;
	
	public $thumbnail;
}

class VolumeInfo {
	public function __construct() {
		$this->authors = new ArrayOf(ArrayOf::VALUE);
		$this->imageLinks = new ImageLink();
		$this->industryIdentifiers = new ArrayOf(ArrayOf::OBJECT, function() {
			return new IndustryIdentifier();
		});
		$this->categories = new ArrayOf(ArrayOf::VALUE);
	}
	
	public $title;

	public $authors;

	public $publisher;
	
	public $publishedDate;
	
	public $description;

	public $pageCount;
	
	public $printType;
	
	/**
	 * @var ArrayOf
	 */
	public $industryIdentifiers;
	
	/**
	 * @var ArrayOf ArrayOf<string>
	 */
	public $categories;

	/**
	 * @var ImageLink
	 */
	public $imageLinks;
	
	public $language;
	
	public $previewLink;
}

class Book {
	
	public function __construct() {
 		$this->volumeInfo = new VolumeInfo();
	}

 	public $volumeInfo;
	
}

function objectToArray($d) {
	if (is_object($d)) {
		// Gets the properties of the given object
		// with get_object_vars function
		$d = get_object_vars($d);
	}

	if (is_array($d)) {
		/*
		 * Return array converted to object
		* Using __FUNCTION__ (Magic constant)
		* for recursive call
		*/
		return array_map(__FUNCTION__, $d);
	}
	else {
		// Return array
		return $d;
	}
}


class BookImport {
	
	public static function run() {
		$itemsPerPage = 40;
		for($index=0; $index<500; $index+=$itemsPerPage)
		{
			$urlGet = "https://www.googleapis.com/books/v1/volumes?maxResults=$itemsPerPage&startIndex=$index&q=hamburger";
			print('g');
			$response = Request::get($urlGet)->send();
			print('G');
			
	// 		var_dump($response->body);
			foreach($response->body->items as $item) {
				print('p');
				$book = self::makeBloomBook($item);
				self::postBloomBook($book);
				print('P');
			}
			//var_dump(count($response->body->items));
			print($index);
		}
	}
	
	public static function makeBloomBook($item) {
		$book = new Book();
		$values = objectToArray($item);
		JsonDecoder::decode($book, $values);
		return $book;
	}
	
	public static function postBloomBook($book) {
		try
		{
			$urlPut = 'https://api.parse.com/1/classes/books';
			$data = JsonEncoder::encode($book);
			$json = json_encode($data);
	// 		var_dump($json);
			$response = Request::post($urlPut)
				->addHeader('X-Parse-Application-Id', 'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5')
				->addHeader('X-Parse-REST-API-Key', 'P6dtPT5Hg8PmBCOxhyN9SPmaJ8W4DcckyW0EZkIx')
				->sendsJson()
				->body($json)
				->send();
			//var_dump($response);
		}
		catch(Exception $z)
		{
			print "\nException $z\n";
		}
	}
	
	
}
 //PHPinfo(); 
BookImport::run();

?>