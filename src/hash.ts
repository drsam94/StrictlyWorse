
export class HashInfo {
  public location: string;
  public args: string;
  public remove_universes_beyond: boolean;

  constructor() {
    let hash = window.location.hash;
    if (hash.endsWith("-uw")) {
      this.remove_universes_beyond = true;
      hash = hash.substring(0, hash.length - 3);
    } else {
      this.remove_universes_beyond = false;
    }
    const dash = hash.indexOf('-');
    if (dash > -1) {
      this.location = hash.substring(1, dash);
      this.args = decodeURI(hash.substring(dash + 1));
    } else {
      this.location = hash.substring(1);
      this.args = "";
    }
  }

  public update(loc: string, args?: string, ub?: boolean) {
    let newhash = loc;
    if (args) {
      newhash += '-';
      newhash += args;
    }
    if (ub ?? this.remove_universes_beyond) {
      newhash += "-uw";
    }
    window.location.hash = newhash;
  }
};

