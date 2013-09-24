using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace BloomLibrary_TestBackend
{
	//NB: To get a controller
	//to be seen, reference it in the DesktopWrapper, like this:
	//Type referenceToForceLoadSoWepAPISeesOurController = typeof(SampleApp_Backend.BooksController);


	/// <summary>
	/// Plugs into our Web API EmbeddedRestServer for doing CRUD over some sample set of books
	/// </summary>
	public class BooksController : ApiController
	{
		//todo: we're going to need dependency injection, or change the behavior of making a new one each time... for now, static
		private static List<Book> _books;
		private int _idCounter;

		public BooksController()
		{
			if (_books == null)
			{
				_books = new List<Book>();

				var source = @"C:\Users\John\Dropbox\PNGBloomShells";
#if USEREALBOOKS
				if(Directory.Exists(source))
				{
					foreach (var collectionDirectory in Directory.GetDirectories(source))
					{
						foreach (var bookDirectory in Directory.GetDirectories(collectionDirectory))
						{
							var book = new Book();

							var thumbnail = Path.Combine(bookDirectory, "thumbnail.png");
							if (!File.Exists(thumbnail))
								continue;//e.g., the .hg directory
							book.Thumbnail = Gekkota.EmbeddedRestServer.PathPrefix + thumbnail; 
							book.Title = Path.GetFileName(bookDirectory);
							book.Id = GetBookId(bookDirectory);
							_books.Add(book);
						}						
					}
				}
				else
#endif
				{
					MakeUpSomeBooks();
				}
			}
		}

		private string GetBookId(string bookDirectory)
		{
			//eventually, go find the html and read out this value:
			//<meta name="bloomBookId" content="056B6F11-4A6C-4942-B2BC-8861E62B03B3" />

			//for now, just increment a counter
			return (++_idCounter).ToString();
		}

		private static void MakeUpSomeBooks()
		{
			var names =
				"Hours after Bay Area drivers made their way across the Bay Bridge's new eastern span for the first time, dozens of people pedaled and walked on the span's newly opened bike and pedestrian path Tuesday morning Oakland city leaders and transit officials were on hand to dedicate the path to late Oakland city planner and longtime bicycle advocate Alexander Zuckermann, for whom the bike path is named A green-and-white sign bearing his name was unveiled "
					.Split(new[] {' '});
			for (int i = 0; i < 30; i++)
			{
				_books.Add(new Book() {Title = names[i], Id = i.ToString(), Author = "Jamie Ford"});
				_books[i].Thumbnail = EmbeddedRestServer.PathPrefix + @"assets\sampleThumbnail.png";
				_books[i].PreviewPDF = EmbeddedRestServer.PathPrefix + @"assets\sampleBookPreview.pdf";
				_books[i].Summary =
					"Self-described amateur forager and mushroom hunter Langdon Cook goes into the woods as Thoreau once did – seeking knowledge, perhaps enlightenment – and comes out with a vast knowledge for the little known world of wild mushrooms and those who seek them. ";
			}
			for (int i = 0; i < 30; i += 2)
			{
				_books[i].Tags = new string[] {"odd", "red"};
			}
			for (int i = 1; i < 30; i += 2)
			{
				_books[i].Tags = new string[] {"even", "blue"};
			}
		}

		public IEnumerable<Book> GetAllBooks()
		{
			return _books;
		}

		public HttpResponseMessage DeleteBook(string id)
		{
			Book book = _books.SingleOrDefault(b => b.Id == id);
			if (book == null)
				throw new HttpResponseException(HttpStatusCode.NotFound); 

			_books.Remove(book);
			return new HttpResponseMessage(HttpStatusCode.NoContent);

		}



		/// <summary>
		/// Update and existing book
		/// </summary>
		public HttpResponseMessage PutBook(Book book)
		{
			if (ModelState.IsValid)
			{
				Debug.Assert(!string.IsNullOrEmpty(book.Id));
				Book foundBook = _books.Where(b => b.Id == book.Id).FirstOrDefault();

				if (foundBook == null)//why always false?
					return Request.CreateResponse<Book>(HttpStatusCode.NotFound, null);//review: what's the right code?

				_books.Remove(foundBook);
				_books.Add(book);
				HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.Accepted, book);//review: what's the right code?
				//response.Headers.Location = new Uri(Request.RequestUri, string.Format("book/{0}", book.Id));//review
				return response;
			}
			else
			{
				return Request.CreateResponse<Book>(HttpStatusCode.BadRequest, null);
			}
		}

		//add a book
		public HttpResponseMessage PostBook(Book book)
		{
			if (ModelState.IsValid)
			{
				Debug.Assert(string.IsNullOrEmpty(book.Id));
				book.Id = Guid.NewGuid().ToString().Substring(0, 4);//4 should get is through the sample
				_books.Add(book);

				HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.Created, book);
				response.Headers.Location = new Uri(Request.RequestUri, string.Format("book/{0}", book.Id));//review
				return response;
			}
			else
			{
				return Request.CreateResponse<Book>(HttpStatusCode.BadRequest, null);
			}
		}

	}
}