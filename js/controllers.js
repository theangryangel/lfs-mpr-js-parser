'use strict';

function FileUploadCtrl($scope)
{
	var dropbox = document.getElementById('dropbox')
	$scope.dropText = 'Drop files here...'
	$scope.results = [];
	$scope.debug = false;

	function dragEnterLeave(evt)
	{
		evt.stopPropagation();
		evt.preventDefault();

		$scope.$apply(function()
		{
			$scope.dropText = 'Drop files here...'
			$scope.dropClass = ''
		});
	}

	dropbox.addEventListener('dragenter', dragEnterLeave, false);
	dropbox.addEventListener('dragleave', dragEnterLeave, false);

	dropbox.addEventListener('dragover', function(evt)
	{
		try
		{
			evt.stopPropagation();
			evt.preventDefault();
			var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf('Files') >= 0;
			$scope.$apply(function()
			{
				$scope.dropText = ok ? 'Drop files here...' : 'Only files are allowed!';
				$scope.dropClass = ok ? 'over' : 'not-available';
			});
		}
		catch(e)
		{
			// lazy
		}
	}, false);

	dropbox.addEventListener('drop', function(evt)
	{
		evt.stopPropagation();
		evt.preventDefault();

		$scope.$apply(function()
		{
			$scope.dropText = 'Drop files here...'
			$scope.dropClass = ''
		});

		var files = evt.dataTransfer.files;

		if (files.length > 0)
		{
			$scope.$apply(function()
			{
				$scope.files = [];
				for (var i = 0; i < files.length; i++)
					$scope.files.push(files[i]);
			});
		}
	}, false);

	$scope.isDragDropAware = function()
	{
		var div = document.createElement('div');
		return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div && window.FileReader);
	};

	$scope.setFiles = function(element)
	{
		$scope.$apply(function($scope)
		{
			$scope.files = [];
			for (var i = 0; i < element.files.length; i++)
				$scope.files.push(element.files[i]);
		});
	};

	$scope.clear = function(element)
	{
		$scope.files = [];
		$scope.results = [];
	};

	$scope.analyse = function()
	{
		$scope.results = [];

		for (var i in $scope.files)
		{
			var file = $scope.files[i];
			var reader = new FileReader();

			reader.onload = function(file)
			{
				return function(evt)
				{
					if (evt.target.readyState == FileReader.DONE)
					{
						var fileheader = String.fromCharCode.apply(null, new Uint8Array(evt.target.result.slice(0, 6)));
						if (fileheader != 'LFSMPR')
						{
							alert('Not a LFS mpr file!');
							return;
						}
	
						// convert the arraybuffer into a 'normal' array
						var buf = new Uint8Array(evt.target.result);
	
						// parse the MPR
						var p = new Mpr(buf, file.name);
	
						$scope.$apply(function($scope)
						{
							$scope.results.push(p);
						});
					}
				}
			}(file);

			// read in the maximum likely size of the MPR that we'll need 
			// that should be the header + (max players * result info)
			var blob = file.slice(0, (80 + (32 * 71)));
			reader.readAsArrayBuffer(blob);
		}
	};
}




