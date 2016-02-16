app.server = function(){
	return {
		endpoints:{
			apis:[{
				url:'user-review',
				path:'user-review.jag',
				secured:false
			},{
				url:'user-reviews',
				path:'user-reviews.jag',
				secured:false
			}],
			pages:[{
				url:'user-reviews',
				path:'user-reviews.jag',
				title:'User Reviews',
				secured:false
			}]
		}
	}
};
