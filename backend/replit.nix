{
  description = "Python FastAPI backend";
  
  deps = {
    python = "3.11";
    channels = [ "nixpkgs" ];
    packages = [
      "python311"
      "pip"
      "uvicorn"
    ];
  };
}
