module.exports = function() {
  this.add( 'foo:1', function(args,done){done(null,{s:'1-'+args.bar,nid:args.nid})} )
  this.add( 'foo:2', function(args,done){done(null,{s:'2-'+args.bar,nid:args.nid})} )
}
