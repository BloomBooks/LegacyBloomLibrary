using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mime;
using System.Threading;
using System.Threading.Tasks;

namespace BloomLibrary_TestBackend
{
	class SimpleFileHandler : DelegatingHandler
	{
		private string _baseFolder;

		public SimpleFileHandler(string fileSystemPathToIndexDotHtml)
		{
			_baseFolder = Path.GetDirectoryName(fileSystemPathToIndexDotHtml);
		}

		protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
		{

			var path = request.RequestUri.AbsolutePath;

			/* This was the start of an experiment rewriting to enable "html5mode" in angular, which gives us much better urls (no "index.html/#"  before every link).
			 * The symptom of incorrect rewriting is that refreshing the browser (e.g. in the BloomLibrary detail dialog) hoses everything.
			 * Where I left it was apparently ok rewriting, but now incorrect maping of the urls to real paths, so that for example 
			 * http://localhost:5432/browse/detail/components/angular-bootstrap/ui-bootstrap-tpls.js should map to 
			 * c:\some-path-to-my-dev-directory\components\angular-bootstrap/ui-bootstrap-tpls.js, dropping the "browse/detail/" part.
			 * Some relevant sites: http://tarkus.me/post/32121691785/angularjs-with-asp-net-mvc-4 http://stackoverflow.com/questions/12614072/how-do-i-configure-iis-for-url-rewriting-an-angularjs-application-in-html5-mode
			 * BTW, if we later return to this, it should be its own message handler. It's just here while I was experimenting.
			if (!(path.Contains("classes") || path.EndsWith(".ico") || path.EndsWith(".gif") || path.EndsWith(".jpg") || path.EndsWith(".html") || path.EndsWith(".png") || path.EndsWith(".pdf") || path.EndsWith(".css") ||
				  path.EndsWith(".js")))
			{
				path = "index.html";
			}
			
			 */

			//This may not be the right way to do things, but for now, use the index.html as our root
			if (path.EndsWith("index.html"))
			{
				//					_baseFolder = Path.GetDirectoryName(path);
				//					_baseFolder = _baseFolder.Trim(new char[]{'\\','/'})+ "/"; 
				path = Path.GetFileName(path);
			}

			if (path.StartsWith("/1/classes/"))
			{
				return base.SendAsync(request, cancellationToken);
			}

			return Task<HttpResponseMessage>.Factory.StartNew(() =>
			{
				path = Uri.UnescapeDataString(path);
				var fullPath = Path.Combine(_baseFolder, path.TrimStart(new char[] { '\\', '/' }));



				if (File.Exists(fullPath))
				{
					var response = request.CreateResponse();
					var stream = new FileStream(fullPath, FileMode.Open);
					response.Content = new StreamContent(stream);	//review: would like to konw that this will do the disposing of the stream at the right time.
					response.Content.Headers.ContentType = GuessMediaTypeFromExtension(fullPath);
					response.Content.Headers.Add("Content-Length", new FileInfo(fullPath).Length.ToString());
					return response;
				}
				else
				{
					return request.CreateErrorResponse(HttpStatusCode.NotFound, "File not found");
				}
			});
		}

		private MediaTypeHeaderValue GuessMediaTypeFromExtension(string path)
		{
			var ext = Path.GetExtension(path);

			switch (ext)
			{
				case ".htm":
				case ".html":
					return new MediaTypeHeaderValue(MediaTypeNames.Text.Html);

				case ".js":
					return new MediaTypeHeaderValue("text/javascript");

				case ".png":
					return new MediaTypeHeaderValue("image/png");

				case ".jpg":
				case ".jpeg":
					return new MediaTypeHeaderValue("image/jpeg");

				case ".gif":
					return new MediaTypeHeaderValue("image/gif");

				case ".css":
					return new MediaTypeHeaderValue("text/css");


				case ".pdf":
					return new MediaTypeHeaderValue("application/pdf");

				default:
					return new MediaTypeHeaderValue(MediaTypeNames.Text.Plain);
			}
		}
	}
}
