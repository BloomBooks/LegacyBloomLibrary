using System;
using System.Linq;
using System.Web.Http;
using System.Web.Http.SelfHost;

namespace BloomLibrary_TestBackend
{
	public class EmbeddedRestServer
	{
		public const string PathPrefix = @"http://localhost:5432/";

		private static EmbeddedRestServer TheOneServer;

		public static EmbeddedRestServer StartupIfNeeded(string fileSystemPathToIndexDotHtml)
		{
			if(TheOneServer==null)
				TheOneServer = new EmbeddedRestServer(fileSystemPathToIndexDotHtml);

			return TheOneServer;
		}

		private EmbeddedRestServer(string fileSystemPathToIndexDotHtml)
		{
			var config = new HttpSelfHostConfiguration(PathPrefix);	
			
			//this "1/classes/" route mirrors the Parse.com REST pattern
			config.Routes.MapHttpRoute("myRest", "1/classes/{controller}/{id}", new { id = RouteParameter.Optional });
			
			//this has nothing to do with REST. But for convencience, we're using the same server process to supply our local static files
			config.MessageHandlers.Add(new SimpleFileHandler(fileSystemPathToIndexDotHtml));


			//by taking out xml, we make it give json somehow
			var appXmlType = config.Formatters.XmlFormatter.SupportedMediaTypes.FirstOrDefault(t => t.MediaType == "application/xml");
			config.Formatters.XmlFormatter.SupportedMediaTypes.Remove(appXmlType);

			var server = new HttpSelfHostServer(config);
			try
			{
				server.OpenAsync().Wait();
			}
			catch (Exception e)
			{
				if (e.InnerException != null && 
					//e.InnerException is System.ServiceModel.AddressAccessDeniedException)
					e.InnerException.Message.Contains("access rights"))
				{
					Console.WriteLine("To use that port on localhost, do this in an elevated shell: netsh http add urlacl url=http://+:5432/ user="+System.Environment.UserName);
				}
				throw e;
			}
		}
	}
}
