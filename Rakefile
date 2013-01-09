require 'rubygems'
require 'bundler'
Bundler.require

desc "Precompiles the assets"
task :precompile do
  FileUtils.mkdir('./build') unless File.exists?('./build')
  manifest = Sprockets::Manifest.new(env.index, './build/assets')
  manifest.compile
end

desc "Starts a test server"
task :server do
  app = Rack::Builder.new do
    map('/assets') { run env }
    map('/') do
      run lambda { |env|
        file = File.open('./app/index.html').read
        [200, {"Content-Type" => "text/html", "Content-Length" => file.length.to_s}, [file]]
      }
    end
  end

  Rack::Handler::Thin.run(app)
end

def env
  @env ||= Sprockets::Environment.new.tap do |env|
    # Tilt::CoffeeScriptTemplate.default_bare = true
    %w(stylesheets javascripts images).each do |p|
      env.append_path File.expand_path("../app/#{p}", __FILE__)
    end
  end
end

