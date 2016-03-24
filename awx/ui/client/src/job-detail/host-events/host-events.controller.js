/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

 export default 
 	['$stateParams', '$scope', '$rootScope', '$state', 'Wait',
 	 'JobDetailService', 'CreateSelect2',
 	function($stateParams, $scope, $rootScope, $state, Wait,
 	 JobDetailService, CreateSelect2){

 	// pagination not implemented yet, but it'll depend on this
 	$scope.page_size = $stateParams.page_size;

 	$scope.activeFilter = $stateParams.filter || null;

 	$scope.search = function(){
 		Wait('start');
 		if ($scope.searchStr == undefined){
 			return
 		}
 		//http://docs.ansible.com/ansible-tower/latest/html/towerapi/intro.html#filtering
 		// SELECT WHERE host_name LIKE str OR WHERE play LIKE str OR WHERE task LIKE str AND host_name NOT ""
 		// selecting non-empty host_name fields prevents us from displaying non-runner events, like playbook_on_task_start
	 	JobDetailService.getRelatedJobEvents($stateParams.id, {
	 		or__host_name__icontains: $scope.searchStr,
	 		or__play__icontains: $scope.searchStr,
	 		or__task__icontains: $scope.searchStr,
	 		not__host_name: "" ,
	 		page_size: $scope.pageSize})
	 			.success(function(res){
	 				$scope.results = res.results;
	 				Wait('stop')
	 	});
 	};

 	$scope.filters = ['all', 'changed', 'failed', 'ok', 'unreachable', 'skipped'];

 	var filter = function(filter){
 		Wait('start');
 		if (filter == 'all'){
	 		return JobDetailService.getRelatedJobEvents($stateParams.id, {
	 			host_name: $stateParams.hostName,
	 			page_size: $scope.pageSize})
	 			.success(function(res){
	 				$scope.results = res.results;
	 				Wait('stop');
	 		});
 		}
 		// handle runner cases
 		if (filter == 'skipped'){
 			return JobDetailService.getRelatedJobEvents($stateParams.id, {
 				host_name: $stateParams.hostName, 
 				event: 'runner_on_skipped'})
 				.success(function(res){
 					$scope.results = res.results;
 					Wait('stop');
 				});
 		}
 		if (filter == 'unreachable'){
  			return JobDetailService.getRelatedJobEvents($stateParams.id, {
 				host_name: $stateParams.hostName, 
 				event: 'runner_on_unreachable'})
 				.success(function(res){
 					$scope.results = res.results;
 					Wait('stop');
 				});
 		}
 		if (filter == 'ok'){
  			return JobDetailService.getRelatedJobEvents($stateParams.id, {
 				host_name: $stateParams.hostName, 
 				event: 'runner_on_ok',
 				changed: false
 				})
 				.success(function(res){
 					$scope.results = res.results;
 					Wait('stop');
 				}); 			
 		}
  		// handle convience properties .changed .failed
 		if (filter == 'changed'){
  			return JobDetailService.getRelatedJobEvents($stateParams.id, {
 				host_name: $stateParams.hostName, 
 				changed: true})
 				.success(function(res){
 					$scope.results = res.results;
 					Wait('stop');
 				}); 			
 		}
 		if (filter == 'failed'){
  			return JobDetailService.getRelatedJobEvents($stateParams.id, {
 				host_name: $stateParams.hostName, 
 				failed: true})
 				.success(function(res){
 					$scope.results = res.results;
 					Wait('stop');
 				}); 			
 		} 		
 	};

 	// watch select2 for changes
 	$('.HostEvents-select').on("select2:select", function (e) {
 	 	filter($('.HostEvents-select').val());
 	});

 	$scope.processStatus = function(event, $index){
 		// the stack for which status to display is
 		// unreachable > failed > changed > ok
 		// uses the API's runner events and convenience properties .failed .changed to determine status. 
 		// see: job_event_callback.py
 		if (event.event == 'runner_on_unreachable'){
 			$scope.results[$index].status = 'Unreachable';
 			return 'HostEvents-status--unreachable'
 		}
 		// equiv to 'runner_on_error' && 'runner on failed'
 		if (event.failed){
  			$scope.results[$index].status = 'Failed';
 			return 'HostEvents-status--failed'
 		}
 		// catch the changed case before ok, because both can be true
 		if (event.changed){
 			$scope.results[$index].status = 'Changed';
 			return 'HostEvents-status--changed'
 		}
 		if (event.event == 'runner_on_ok'){
 			$scope.results[$index].status = 'OK';
 			return 'HostEvents-status--ok'
 		}
 		if (event.event == 'runner_on_skipped'){
 			$scope.results[$index].status = 'Skipped';
 			return 'HostEvents-status--skipped'
 		}
 		else{
 			// study a case where none of these apply
 		}
 	};


 	var init = function(){
 		// create filter dropdown
 		CreateSelect2({
 			element: '.HostEvents-select',
 			multiple: false
 		});
 		// process the filter if one was passed
 		if ($stateParams.filter){
 			filter($stateParams.filter).success(function(res){
	 				$scope.results = res.results;
	 				Wait('stop');
	 				$('#HostEvents').modal('show');
	 		});;
 		}
 		else{
 			Wait('start');
	 		JobDetailService.getRelatedJobEvents($stateParams.id, {
	 			host_name: $stateParams.hostName,
	 			page_size: $stateParams.page_size})
	 			.success(function(res){
	 				$scope.pagination = res;
	 				$scope.results = res.results;
	 				Wait('stop');
	 				$('#HostEvents').modal('show');

	 		});
 		}	
 	};

 	$scope.goBack = function(){
 		// go back to the job details state
 		// we're leaning on $stateProvider's onExit to close the modal
 		$state.go('jobDetail');
 	};

 	init();

 	}];