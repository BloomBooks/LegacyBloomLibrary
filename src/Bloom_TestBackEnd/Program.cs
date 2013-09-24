using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace BloomLibrary_TestBackend
{
	static class Program
	{
		[STAThread]
		static void Main()
		{
			Debug.WriteLine(Environment.CurrentDirectory);

			EmbeddedRestServer.StartupIfNeeded(Path.Combine(DirectoryOfTheApplicationExecutable, @"..\..\src\BloomLibrary_AngularApp\app\index.html"));

			Process.Start(EmbeddedRestServer.PathPrefix + "index.html");

			Console.WriteLine("Serving Bloom Test Backend Server. Press Enter to quit");
			Console.ReadLine();
		}


		public static string DirectoryOfTheApplicationExecutable
		{
			get
			{
				string path;
				bool unitTesting = Assembly.GetEntryAssembly() == null;
				if (unitTesting)
				{
					path = new Uri(Assembly.GetExecutingAssembly().CodeBase).AbsolutePath;
					path = Uri.UnescapeDataString(path);
				}
				else
				{
					path = Assembly.GetEntryAssembly().Location;
				}
				return Directory.GetParent(path).FullName;
			}
		}

	}
}
