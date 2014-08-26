var APPKEY = "737ae99a-5d87-11e3-9c76-1506fbcc2da2";

describe('A test for MultiParty.util', function() {
  describe('makeID', function(){
    it('should returns 32 length digit string', function() {
      var id = MultiParty.util.makeID();
      id.should.be.an.instanceOf(String).and.have.lengthOf(32);
      id.should.match(/^\d{32}$/);
    });
  });

  describe('checkOpts_', function(){

    describe('property : key', function(){
      it('should throw when undefined', function(){
        (function(){
          MultiParty.util.checkOpts_({});
        }).should.throw();
      });

      it('should throw when not string', function(){
        (function(){
          MultiParty.util.checkOpts_({"key": 0});
        }).should.throw();
      });

      it('should throw when string pattern is wrong', function(){
        (function(){
          MultiParty.util.checkOpts_({"key": "abc"});
        }).should.throw();
      });

      it('should not throw when correct pattern', function(){
        (function(){
          MultiParty.util.checkOpts_({"key": APPKEY});
        }).should.not.throw();
      });

    });

    describe('property : room_name', function(){
      it('should be blank when not indicated', function(){
        MultiParty.util.checkOpts_({"key": APPKEY})
          .should.have.property('room_name', '');
      });

      it('should be blank when value is not string', function(){
        MultiParty.util.checkOpts_({"key": APPKEY, "room": -1})
          .should.have.property('room_name', '');
      });

      it('should throw when value does not match correct pattern (too short)', function(){
        (function(){
          MultiParty.util.checkOpts_({"key": APPKEY, "room": "abc"});
        }).should.throw();
      });

      it('should throw when value does not match correct pattern (too long)', function(){
        (function(){
          var r = "";
          for(var i = 0; i < 33; i++) { r += "a"; }

          MultiParty.util.checkOpts_({"key": APPKEY, "room": r});
        }).should.throw();
      });

      it('should throw when value does not match correct pattern (includes non digit or alphabet)', function(){
        (function(){
          MultiParty.util.checkOpts_({"key": APPKEY, "room": "abc@"});
        }).should.throw();
      });

      it('should be same as indicated when correct string (length = 4)', function(){
        MultiParty.util.checkOpts_({"key": APPKEY, "room": "test"})
          .should.have.property('room_name', 'test');
      });

      it('should be same as indicated when correct string (length = 32)', function(){
        var r = "";
        for(var i = 0; i < 32; i++) { r += "a"; }

        MultiParty.util.checkOpts_({"key": APPKEY, "room": r})
          .should.have.property('room_name', r);
      });
    });

    describe('property : room_id', function(){
      it('should be length of 8 and end with "R_"', function(){
        MultiParty.util.checkOpts_({"key": APPKEY, "room": ""}).should
          .have.property('room_id').with.lengthOf(8)

        MultiParty.util.checkOpts_({"key": APPKEY, "room": ""}).should
          .have.property('room_id').with.match(/R_$/)
      });

      it('should be different when different "room" values are indicated', function(){
        var opt0 = MultiParty.util.checkOpts_({"key": APPKEY, "room": ""})
        var opt1 = MultiParty.util.checkOpts_({"key": APPKEY, "room": "test"})

        opt0.room_id.should.not.eql(opt1.room_id);
      });
    });

    describe('property : id', function(){
      it('should be automatically generated when not indicated', function(){
      });

      it('should be automatically generated when type is not string', function(){
      });

      it('should throw error when non-digit or alphabet id is specified', function(){
      });

      it('should throw error when id includes capitarized alphabet', function(){
      });

      it('should throw error when length is larger than 32', function(){
      });

      it('should throw error when length is less than 8', function(){
      });

      it('should return when length is 8', function(){
      });

      it('should return when length is 32', function(){
      });
    });

    describe('property : reliable', function(){

      it('should be false when undefined', function(){
      });

      it('should be false when 0 is indicated', function(){
      });

      it('should be false when false is indicated', function(){
      });

      it('should be true when true is indicated', function(){
      });

      it('should be true when truly value is indicated', function(){
      });
    });

    describe('property : video_stream', function(){
      it('should be false when undefined', function(){
      });

      it('should be false when 0 is indicated', function(){
      });

      it('should be false when false is indicated', function(){
      });

      it('should be true when true is indicated', function(){
      });

      it('should be true when truly value is indicated', function(){
      });

    });

    describe('property : audio_stream', function(){
      it('should be false when undefined', function(){
      });

      it('should be false when 0 is indicated', function(){
      });

      it('should be false when false is indicated', function(){
      });

      it('should be true when true is indicated', function(){
      });

      it('should be true when truly value is indicated', function(){
      });

    });

    describe('property : use_stream', function(){
      it('should be true when video_stream and audio_stream are both true', function(){
      });

      it('should be true when video_stream equal true but audio_stream is false', function(){
      });

      it('should be true when video_stream equal false but audio_stream is true', function(){
      });

      it('should be false when both video_stream and audio_stream are false', function(){
      });
    });
  });

});

