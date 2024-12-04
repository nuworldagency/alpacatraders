{
  description = "TradeViewPro Full Stack";
  
  deps = {
    channels = [ "nixpkgs" ];
    packages = [
      "nodejs-18_x"
      "python311"
      "python311Packages.pip"
      "yarn"
    ];
  };
}
